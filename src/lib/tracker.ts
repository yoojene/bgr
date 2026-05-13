import {
  checkpoints,
  trackerDeviceId,
  trackerEventId,
  trackerParticipantBib,
  trackerParticipantName,
  trackerRouteId,
  type Checkpoint,
  type CheckpointType,
} from "@/data/bgr-data";
import { getPlannedArrival } from "@/lib/race";

const trackerParticipantUrl = `https://track.trail.live/event/${trackerEventId}/participant`;
const trackerRoutesUrl = `https://track.trail.live/event/${trackerEventId}/routes`;
const trackerRevalidateSeconds = 120;
const staleMultiplier = 3;

type TrackTrailRouteSummary = {
  id: number | null;
  name: string;
  start: string | null;
  finished?: string | null;
  dist?: number | null;
  speed?: number | null;
  durn?: number | null;
};

type TrackTrailReport = {
  timestamp: string;
  lat: number;
  lon: number;
  heading?: number | null;
  battery?: number | null;
  report?: string | null;
  stale?: boolean;
};

type TrackTrailParticipant = {
  id: number | null;
  tracker: string;
  trackerType: string | null;
  name: string;
  bib: string | null;
  retired: boolean;
  lastReport: TrackTrailReport | null;
  reportInterval?: number | null;
  routes: TrackTrailRouteSummary[];
};

type TrackTrailRoutePoint = {
  id: number;
  lat: number;
  lon: number;
  dist?: number | null;
  elev?: number | null;
  checkpoint?: string | null;
};

type TrackTrailRoute = {
  id: number | null;
  name: string;
  colour?: string | null;
  start?: string | null;
  end?: string | null;
  coords: TrackTrailRoutePoint[];
};

export type TrackerStatus = "unavailable" | "pre-start" | "live" | "stale" | "retired";

export type TrackerCheckpointSummary = {
  name: string;
  leg: string;
  type: CheckpointType;
  plannedArrivalIso: string;
  routeDistanceKm: number | null;
};

export type TrackerState = {
  participant: {
    id: number | null;
    name: string;
    bib: string | null;
    tracker: string;
    trackerType: string | null;
    retired: boolean;
  } | null;
  reportIntervalSeconds: number;
  status: TrackerStatus;
  fetchedAt: string;
  lastUpdatedAt: string | null;
  lastReport: {
    timestamp: string;
    latitude: number;
    longitude: number;
    heading: number | null;
    battery: number | null;
    report: string | null;
    stale: boolean;
  } | null;
  route: {
    id: number | null;
    name: string;
    pointCount: number;
    checkpointCount: number;
  } | null;
  progress: {
    snappedDistanceKm: number | null;
    distanceToRouteMeters: number | null;
    lastCheckpoint: TrackerCheckpointSummary | null;
    nextCheckpoint: TrackerCheckpointSummary | null;
    distanceToNextCheckpointKm: number | null;
  };
  source: {
    participantUrl: string;
    routesUrl: string;
  };
};

function parseTrackTrailTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\[[^\]]+\]$/, "");
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoString(value: string | null | undefined) {
  const parsed = parseTrackTrailTimestamp(value);
  return parsed ? parsed.toISOString() : null;
}

function normalizeCheckpointName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const routeCheckpointAliases = new Map<string, string>([
  ["start", "Moot Hall"],
  ["finish", "Moot Hall"],
  ["gtcalva", "Great Calva"],
  ["watsondodd", "Watson's Dodd"],
  ["seatsandal", "Seat Sandal"],
  ["pikeostickle", "Pike of Stickle"],
  ["wasdalecampcarpark", "Wasdale NT CP"],
  ["honisteryhacarpark", "Honister Pass"],
  ["hindscrath", "Hindscarth"],
]);

const checkpointByName = new Map<string, Checkpoint>(
  checkpoints.map((checkpoint) => [normalizeCheckpointName(checkpoint.name), checkpoint]),
);

function findScheduledCheckpoint(routeCheckpointName: string) {
  const normalizedName = normalizeCheckpointName(routeCheckpointName);
  const mappedName = routeCheckpointAliases.get(normalizedName);

  if (mappedName) {
    return checkpoints.find((checkpoint) => checkpoint.name === mappedName) ?? null;
  }

  return checkpointByName.get(normalizedName) ?? null;
}

function haversineDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = ((latitudeB - latitudeA) * Math.PI) / 180;
  const longitudeDelta = ((longitudeB - longitudeA) * Math.PI) / 180;
  const latitudeARadians = (latitudeA * Math.PI) / 180;
  const latitudeBRadians = (latitudeB * Math.PI) / 180;

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeARadians) *
      Math.cos(latitudeBRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function selectParticipant(payload: TrackTrailParticipant | TrackTrailParticipant[]) {
  const participants = Array.isArray(payload) ? payload : [payload];

  return (
    participants.find(
      (participant) =>
        participant.name === trackerParticipantName ||
        participant.bib === trackerParticipantBib ||
        participant.tracker === trackerDeviceId ||
        participant.routes.some((route) => route.id === trackerRouteId),
    ) ?? null
  );
}

function selectRoute(
  routes: TrackTrailRoute[],
  participant: TrackTrailParticipant | null,
) {
  const participantRouteId = participant?.routes[0]?.id ?? trackerRouteId;

  return (
    routes.find((route) => route.id === participantRouteId) ??
    routes.find((route) => route.id === trackerRouteId) ??
    routes[0] ??
    null
  );
}

function toCheckpointSummary(
  routeCheckpointName: string,
  routeDistanceKm: number | null,
): TrackerCheckpointSummary | null {
  const checkpoint = findScheduledCheckpoint(routeCheckpointName);

  if (!checkpoint) {
    return null;
  }

  return {
    name: checkpoint.name,
    leg: checkpoint.leg,
    type: checkpoint.type,
    plannedArrivalIso: getPlannedArrival(checkpoint).toISOString(),
    routeDistanceKm,
  };
}

function buildProgress(
  route: TrackTrailRoute | null,
  lastReport: TrackTrailReport | null,
) {
  if (!route || !lastReport || route.coords.length === 0) {
    return {
      snappedDistanceKm: null,
      distanceToRouteMeters: null,
      lastCheckpoint: null,
      nextCheckpoint: null,
      distanceToNextCheckpointKm: null,
    };
  }

  const nearestPoint = route.coords.reduce<TrackTrailRoutePoint | null>((closest, point) => {
    const distanceMeters = haversineDistanceMeters(
      lastReport.lat,
      lastReport.lon,
      point.lat,
      point.lon,
    );

    if (!closest) {
      return { ...point, elev: distanceMeters };
    }

    return (closest.elev ?? Number.POSITIVE_INFINITY) <= distanceMeters
      ? closest
      : { ...point, elev: distanceMeters };
  }, null);

  const snappedDistanceKm = nearestPoint?.dist ?? null;
  const namedCheckpoints = route.coords.filter(
    (point): point is TrackTrailRoutePoint & { checkpoint: string } =>
      typeof point.checkpoint === "string" && point.checkpoint.trim().length > 0,
  );
  const lastNamedCheckpoint =
    [...namedCheckpoints]
      .reverse()
      .find((point) => (point.dist ?? Number.POSITIVE_INFINITY) <= (snappedDistanceKm ?? -1)) ??
    null;
  const nextNamedCheckpoint =
    namedCheckpoints.find(
      (point) => (point.dist ?? Number.NEGATIVE_INFINITY) > (snappedDistanceKm ?? Number.NEGATIVE_INFINITY),
    ) ?? null;

  return {
    snappedDistanceKm,
    distanceToRouteMeters: nearestPoint?.elev ?? null,
    lastCheckpoint: lastNamedCheckpoint
      ? toCheckpointSummary(lastNamedCheckpoint.checkpoint, lastNamedCheckpoint.dist ?? null)
      : null,
    nextCheckpoint: nextNamedCheckpoint
      ? toCheckpointSummary(nextNamedCheckpoint.checkpoint, nextNamedCheckpoint.dist ?? null)
      : null,
    distanceToNextCheckpointKm:
      snappedDistanceKm !== null && nextNamedCheckpoint?.dist !== undefined && nextNamedCheckpoint?.dist !== null
        ? Math.max(0, nextNamedCheckpoint.dist - snappedDistanceKm)
        : null,
  };
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: trackerRevalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Tracker request failed for ${url}`);
  }

  return (await response.json()) as T;
}

export async function getTrackerState(): Promise<TrackerState> {
  const fetchedAt = new Date();
  const [participantResult, routesResult] = await Promise.allSettled([
    fetchJson<TrackTrailParticipant | TrackTrailParticipant[]>(trackerParticipantUrl),
    fetchJson<TrackTrailRoute[]>(trackerRoutesUrl),
  ]);

  const participantPayload = participantResult.status === "fulfilled" ? participantResult.value : null;
  const routesPayload = routesResult.status === "fulfilled" ? routesResult.value : [];
  const participant = participantPayload ? selectParticipant(participantPayload) : null;
  const route = selectRoute(routesPayload, participant);
  const lastReport = participant?.lastReport ?? null;
  const lastUpdatedAt = toIsoString(lastReport?.timestamp);
  const reportIntervalSeconds = participant?.reportInterval ?? trackerRevalidateSeconds;
  const staleThresholdMilliseconds = reportIntervalSeconds * staleMultiplier * 1000;
  const parsedLastUpdatedAt = lastUpdatedAt ? new Date(lastUpdatedAt) : null;
  const isTrackerStale =
    participant?.retired ?? false
      ? false
      : lastReport?.stale === true ||
        (parsedLastUpdatedAt
          ? fetchedAt.getTime() - parsedLastUpdatedAt.getTime() > staleThresholdMilliseconds
          : false);

  const progress = buildProgress(route, lastReport);

  return {
    participant: participant
      ? {
          id: participant.id,
          name: participant.name,
          bib: participant.bib,
          tracker: participant.tracker,
          trackerType: participant.trackerType,
          retired: participant.retired,
        }
      : null,
    reportIntervalSeconds,
    status: participant
      ? participant.retired
        ? "retired"
        : !lastReport
          ? "pre-start"
          : isTrackerStale
            ? "stale"
            : "live"
      : "unavailable",
    fetchedAt: fetchedAt.toISOString(),
    lastUpdatedAt,
    lastReport: lastReport && lastUpdatedAt
      ? {
          timestamp: lastUpdatedAt,
          latitude: lastReport.lat,
          longitude: lastReport.lon,
          heading: lastReport.heading ?? null,
          battery: lastReport.battery ?? null,
          report: lastReport.report ?? null,
          stale: Boolean(lastReport.stale),
        }
      : null,
    route: route
      ? {
          id: route.id,
          name: route.name,
          pointCount: route.coords.length,
          checkpointCount: route.coords.filter((point) => point.checkpoint).length,
        }
      : null,
    progress,
    source: {
      participantUrl: trackerParticipantUrl,
      routesUrl: trackerRoutesUrl,
    },
  };
}