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
import {
  listTrackerArrivals,
  upsertTrackerArrivals,
  type StoredTrackerArrival,
} from "@/lib/tracker-arrivals-store";

const trackerParticipantUrl = `https://track.trail.live/event/${trackerEventId}/participant`;
const trackerRoutesUrl = `https://track.trail.live/event/${trackerEventId}/routes`;
const trackerRevalidateSeconds = 120;
const staleMultiplier = 3;

const scheduledCourseCheckpoints = checkpoints.filter(
  (checkpoint) => checkpoint.type !== "departure",
);

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

type TrackTrailParticipantCheckpoint = {
  id: number;
  name: string;
  lat?: number | null;
  lon?: number | null;
  distance?: number | null;
  elevation?: number | null;
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
    checkpoints: TrackerCheckpointSummary[];
  } | null;
  progress: {
    snappedDistanceKm: number | null;
    completionPercent: number | null;
    totalDistanceKm: number | null;
    distanceToRouteMeters: number | null;
    lastCheckpoint: TrackerCheckpointSummary | null;
    nextCheckpoint: TrackerCheckpointSummary | null;
    distanceToNextCheckpointKm: number | null;
  };
  arrivals: StoredTrackerArrival[];
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
  ["gtdodd", "Great Dodd"],
  ["watsondodd", "Watson's Dodd"],
  ["watsonsdod", "Watson's Dodd"],
  ["stybarrowd", "Stybarrow Dodd"],
  ["seatsandal", "Seat Sandal"],
  ["hellvelyn", "Helvellyn"],
  ["nethermost", "Nethermost Pike"],
  ["dollywagon", "Dollywagon Pike"],
  ["dunmailra", "Dunmail Raise"],
  ["sergentma", "Sergeant Man"],
  ["thunacark", "Thurnacar Knott"],
  ["harrisons", "Harrison Stickle"],
  ["pikeostickle", "Pike of Stickle"],
  ["rossettpi", "Rossett Pike"],
  ["bowfell", "Bowfell"],
  ["scafellpi", "Scafell Pike"],
  ["wasdalecp", "Wasdale NT CP"],
  ["wasdalecampcarpark", "Wasdale NT CP"],
  ["greatgabl", "Great Gable"],
  ["greygabl", "Green Gable"],
  ["greyknott", "Grey Knotts"],
  ["honisterc", "Honister Pass"],
  ["honisteryhacarpark", "Honister Pass"],
  ["hindscrath", "Hindscarth"],
  ["dalehead", "Dale Head"],
]);

const checkpointByName = new Map<string, Checkpoint>(
  checkpoints.map((checkpoint) => [normalizeCheckpointName(checkpoint.name), checkpoint]),
);

const scheduledCourseCheckpointIndexByName = new Map(
  scheduledCourseCheckpoints.map((checkpoint, index) => [checkpoint.name, index]),
);

function getTrackerParticipantCheckpointsUrl(
  participantId: number,
  routeId: number | null,
) {
  const searchParams = new URLSearchParams();

  if (routeId !== null) {
    searchParams.set("route", String(routeId));
  }

  return `https://track.trail.live/event/${trackerEventId}/participants/${participantId}/checkpoints?${searchParams.toString()}`;
}

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
  checkpointDistanceByName?: Map<string, number | null>,
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
    routeDistanceKm: checkpointDistanceByName?.get(checkpoint.name) ?? routeDistanceKm,
  };
}

function buildRouteCheckpointDistanceMap(route: TrackTrailRoute | null) {
  const checkpointDistanceByName = new Map<string, number | null>();

  if (!route) {
    return checkpointDistanceByName;
  }

  for (const point of route.coords) {
    if (typeof point.checkpoint !== "string" || point.checkpoint.trim().length === 0) {
      continue;
    }

    const checkpoint = findScheduledCheckpoint(point.checkpoint);

    if (checkpoint) {
      checkpointDistanceByName.set(checkpoint.name, point.dist ?? null);
    }
  }

  return checkpointDistanceByName;
}

function buildParticipantCheckpointDistanceMap(
  participantCheckpoints: TrackTrailParticipantCheckpoint[],
) {
  const checkpointDistanceByName = new Map<string, number | null>();
  const matchedCheckpointNames = new Set<string>();

  for (const [index, participantCheckpoint] of participantCheckpoints.entries()) {
    const expectedCheckpoint = scheduledCourseCheckpoints[index] ?? null;
    const matchedCheckpoint = findScheduledCheckpoint(participantCheckpoint.name);
    const matchedCheckpointIndex = matchedCheckpoint
      ? scheduledCourseCheckpointIndexByName.get(matchedCheckpoint.name)
      : undefined;

    let resolvedCheckpoint: Checkpoint | null = null;

    if (
      matchedCheckpoint &&
      matchedCheckpoint.type !== "departure" &&
      !matchedCheckpointNames.has(matchedCheckpoint.name) &&
      matchedCheckpointIndex !== undefined &&
      Math.abs(matchedCheckpointIndex - index) <= 1
    ) {
      resolvedCheckpoint = matchedCheckpoint;
    } else if (
      expectedCheckpoint &&
      !matchedCheckpointNames.has(expectedCheckpoint.name)
    ) {
      resolvedCheckpoint = expectedCheckpoint;
    } else if (
      matchedCheckpoint &&
      matchedCheckpoint.type !== "departure" &&
      !matchedCheckpointNames.has(matchedCheckpoint.name)
    ) {
      resolvedCheckpoint = matchedCheckpoint;
    }

    if (!resolvedCheckpoint) {
      continue;
    }

    matchedCheckpointNames.add(resolvedCheckpoint.name);
    checkpointDistanceByName.set(
      resolvedCheckpoint.name,
      participantCheckpoint.distance ?? null,
    );
  }

  return checkpointDistanceByName;
}

function buildCheckpointDistanceMap(
  route: TrackTrailRoute | null,
  participantCheckpoints: TrackTrailParticipantCheckpoint[],
) {
  const checkpointDistanceByName = buildRouteCheckpointDistanceMap(route);

  for (const [name, distanceKm] of buildParticipantCheckpointDistanceMap(
    participantCheckpoints,
  )) {
    checkpointDistanceByName.set(name, distanceKm);
  }

  return checkpointDistanceByName;
}

function buildProgress(
  route: TrackTrailRoute | null,
  lastReport: TrackTrailReport | null,
  checkpointDistanceByName: Map<string, number | null>,
) {
  if (!route || !lastReport || route.coords.length === 0) {
    return {
      snappedDistanceKm: null,
      completionPercent: null,
      totalDistanceKm: null,
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
  const totalDistanceKm = route.coords[route.coords.length - 1]?.dist ?? null;

  return {
    snappedDistanceKm,
    completionPercent:
      snappedDistanceKm !== null && totalDistanceKm && totalDistanceKm > 0
        ? Math.min(100, Math.max(0, (snappedDistanceKm / totalDistanceKm) * 100))
        : null,
    totalDistanceKm,
    distanceToRouteMeters: nearestPoint?.elev ?? null,
    lastCheckpoint: lastNamedCheckpoint
      ? toCheckpointSummary(
          lastNamedCheckpoint.checkpoint,
          lastNamedCheckpoint.dist ?? null,
          checkpointDistanceByName,
        )
      : null,
    nextCheckpoint: nextNamedCheckpoint
      ? toCheckpointSummary(
          nextNamedCheckpoint.checkpoint,
          nextNamedCheckpoint.dist ?? null,
          checkpointDistanceByName,
        )
      : null,
    distanceToNextCheckpointKm:
      snappedDistanceKm !== null && nextNamedCheckpoint
        ? Math.max(
            0,
            (toCheckpointSummary(
              nextNamedCheckpoint.checkpoint,
              nextNamedCheckpoint.dist ?? null,
              checkpointDistanceByName,
            )?.routeDistanceKm ?? nextNamedCheckpoint.dist ?? 0) - snappedDistanceKm,
          )
        : null,
  };
}

function getRouteCheckpointSummaries(
  route: TrackTrailRoute | null,
  checkpointDistanceByName: Map<string, number | null>,
) {
  if (!route) {
    return [] as TrackerCheckpointSummary[];
  }

  const summariesByName = new Map<string, TrackerCheckpointSummary>();

  for (const point of route.coords) {
    if (typeof point.checkpoint !== "string" || point.checkpoint.trim().length === 0) {
      continue;
    }

    const summary = toCheckpointSummary(
      point.checkpoint,
      point.dist ?? null,
      checkpointDistanceByName,
    );

    if (summary) {
      summariesByName.set(summary.name, summary);
    }
  }

  return checkpoints
    .map((checkpoint) => summariesByName.get(checkpoint.name))
    .filter((summary): summary is TrackerCheckpointSummary => Boolean(summary));
}

function inferCheckpointArrivals(
  route: TrackTrailRoute | null,
  progress: ReturnType<typeof buildProgress>,
  lastUpdatedAt: string | null,
  existingArrivals: StoredTrackerArrival[],
  checkpointDistanceByName: Map<string, number | null>,
) {
  if (!route || progress.snappedDistanceKm === null || !lastUpdatedAt) {
    return existingArrivals;
  }

  const arrivalsByCheckpoint = new Map(
    existingArrivals.map((arrival) => [arrival.checkpointName, arrival]),
  );
  const routeCheckpointSummaries = route.coords
    .filter(
      (point): point is TrackTrailRoutePoint & { checkpoint: string } =>
        typeof point.checkpoint === "string" && point.checkpoint.trim().length > 0,
    )
    .map((point) => ({
      summary: toCheckpointSummary(
        point.checkpoint,
        point.dist ?? null,
        checkpointDistanceByName,
      ),
    }))
    .filter(
      (
        checkpoint,
      ): checkpoint is {
        summary: TrackerCheckpointSummary;
      } => Boolean(checkpoint.summary),
    );

  for (const checkpoint of routeCheckpointSummaries) {
    if (
      checkpoint.summary.routeDistanceKm !== null &&
      checkpoint.summary.routeDistanceKm <= progress.snappedDistanceKm &&
      !arrivalsByCheckpoint.has(checkpoint.summary.name)
    ) {
      arrivalsByCheckpoint.set(checkpoint.summary.name, {
        checkpointName: checkpoint.summary.name,
        arrivedAt: lastUpdatedAt,
      });
    }
  }

  return checkpoints
    .map((checkpoint) => arrivalsByCheckpoint.get(checkpoint.name))
    .filter((arrival): arrival is StoredTrackerArrival => Boolean(arrival));
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
  const participantCheckpointsResult =
    participant?.id !== null && participant?.id !== undefined
      ? await Promise.allSettled([
          fetchJson<TrackTrailParticipantCheckpoint[]>(
            getTrackerParticipantCheckpointsUrl(
              participant.id,
              route?.id ?? participant.routes[0]?.id ?? trackerRouteId,
            ),
          ),
        ])
      : [];
  const participantCheckpoints =
    participantCheckpointsResult[0]?.status === "fulfilled"
      ? participantCheckpointsResult[0].value
      : [];
  const lastReport = participant?.lastReport ?? null;
  const lastUpdatedAt = toIsoString(lastReport?.timestamp);
  const existingArrivals = await listTrackerArrivals();
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

  const checkpointDistanceByName = buildCheckpointDistanceMap(
    route,
    participantCheckpoints,
  );
  const progress = buildProgress(route, lastReport, checkpointDistanceByName);
  const routeCheckpoints = getRouteCheckpointSummaries(
    route,
    checkpointDistanceByName,
  );
  const arrivals = inferCheckpointArrivals(
    route,
    progress,
    lastUpdatedAt,
    existingArrivals,
    checkpointDistanceByName,
  );

  if (arrivals.length > existingArrivals.length) {
    await upsertTrackerArrivals(arrivals);
  }

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
          checkpoints: routeCheckpoints,
        }
      : {
          id: null,
          name: "",
          pointCount: 0,
          checkpointCount: 0,
          checkpoints: [],
        },
    progress,
    arrivals,
    source: {
      participantUrl: trackerParticipantUrl,
      routesUrl: trackerRoutesUrl,
    },
  };
}