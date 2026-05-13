import type { TrackerState } from "@/lib/tracker";

function createMockTrackerState(overrides: Partial<TrackerState>): TrackerState {
  const timestamp = new Date().toISOString();

  return {
    participant: {
      id: 1,
      name: "Eugene",
      bib: "1",
      tracker: "tracker3832",
      trackerType: "mock",
      retired: false,
    },
    reportIntervalSeconds: 60,
    status: "live",
    fetchedAt: timestamp,
    lastUpdatedAt: timestamp,
    lastReport: {
      timestamp,
      latitude: 54.66,
      longitude: -3.1,
      heading: null,
      battery: 82,
      report: null,
      stale: false,
    },
    route: {
      id: 36668,
      name: "Bob Graham Round",
      pointCount: 100,
      checkpointCount: 47,
    },
    progress: {
      snappedDistanceKm: 6.2,
      completionPercent: 5.8,
      totalDistanceKm: 106,
      distanceToRouteMeters: 8,
      lastCheckpoint: null,
      nextCheckpoint: {
        name: "Skiddaw",
        leg: "1",
        type: "summit",
        plannedArrivalIso: "2026-05-15T19:20:00.000Z",
        routeDistanceKm: 9.5,
      },
      distanceToNextCheckpointKm: 3.3,
    },
    arrivals: [],
    source: {
      participantUrl: "https://track.trail.live/event/32670/participant",
      routesUrl: "https://track.trail.live/event/32670/routes",
    },
    ...overrides,
  };
}

export function parseMockTrackerStage(value: string | string[] | null | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (!firstValue) {
    return null;
  }

  const parsed = Number.parseInt(firstValue, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getMockTrackerState(stage: number): TrackerState {
  if (stage <= 0) {
    return createMockTrackerState({});
  }

  if (stage === 1) {
    return createMockTrackerState({
      lastReport: {
        timestamp: new Date().toISOString(),
        latitude: 54.66,
        longitude: -3.16,
        heading: null,
        battery: 74,
        report: null,
        stale: false,
      },
      progress: {
        snappedDistanceKm: 10.4,
        completionPercent: 9.8,
        totalDistanceKm: 106,
        distanceToRouteMeters: 4,
        lastCheckpoint: {
          name: "Skiddaw",
          leg: "1",
          type: "summit",
          plannedArrivalIso: "2026-05-15T20:20:00.000Z",
          routeDistanceKm: 9.5,
        },
        nextCheckpoint: {
          name: "Great Calva",
          leg: "1",
          type: "summit",
          plannedArrivalIso: "2026-05-15T21:02:00.000Z",
          routeDistanceKm: 14.2,
        },
        distanceToNextCheckpointKm: 3.8,
      },
      arrivals: [
        {
          checkpointName: "Skiddaw",
          arrivedAt: "2026-05-15T20:20:00.000+01:00",
        },
      ],
    });
  }

  return createMockTrackerState({
    lastReport: {
      timestamp: new Date().toISOString(),
      latitude: 54.67,
      longitude: -3.08,
      heading: null,
      battery: 52,
      report: null,
      stale: false,
    },
    progress: {
      snappedDistanceKm: 15.4,
      completionPercent: 14.5,
      totalDistanceKm: 106,
      distanceToRouteMeters: 6,
      lastCheckpoint: {
        name: "Great Calva",
        leg: "1",
        type: "summit",
        plannedArrivalIso: "2026-05-15T21:02:00.000Z",
        routeDistanceKm: 14.2,
      },
      nextCheckpoint: {
        name: "Blencathra",
        leg: "1",
        type: "summit",
        plannedArrivalIso: "2026-05-15T22:08:00.000Z",
        routeDistanceKm: 20.4,
      },
      distanceToNextCheckpointKm: 5,
    },
    arrivals: [
      {
        checkpointName: "Skiddaw",
        arrivedAt: "2026-05-15T20:20:00.000+01:00",
      },
      {
        checkpointName: "Great Calva",
        arrivedAt: "2026-05-15T21:02:00.000+01:00",
      },
    ],
  });
}