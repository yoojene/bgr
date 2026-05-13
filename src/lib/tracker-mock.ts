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
      checkpoints: [
        {
          name: "Moot Hall",
          leg: "5",
          type: "finish",
          plannedArrivalIso: "2026-05-15T15:57:00.000Z",
          routeDistanceKm: 104.607,
        },
        {
          name: "Threlkeld",
          leg: "1/2",
          type: "changeover",
          plannedArrivalIso: "2026-05-15T21:37:00.000Z",
          routeDistanceKm: 20.965,
        },
        {
          name: "Dunmail Raise",
          leg: "2/3",
          type: "changeover",
          plannedArrivalIso: "2026-05-16T02:02:00.000Z",
          routeDistanceKm: 43.298,
        },
        {
          name: "Wasdale NT CP",
          leg: "3/4",
          type: "changeover",
          plannedArrivalIso: "2026-05-16T07:51:00.000Z",
          routeDistanceKm: 68.857,
        },
        {
          name: "Honister Pass",
          leg: "4/5",
          type: "changeover",
          plannedArrivalIso: "2026-05-16T12:55:00.000Z",
          routeDistanceKm: 86.974,
        },
      ],
    },
    progress: {
      snappedDistanceKm: 6.2,
      completionPercent: 5.9,
      totalDistanceKm: 104.607,
      distanceToRouteMeters: 8,
      lastCheckpoint: null,
      nextCheckpoint: {
        name: "Skiddaw",
        leg: "1",
        type: "summit",
        plannedArrivalIso: "2026-05-15T19:20:00.000Z",
        routeDistanceKm: 8.176,
      },
      distanceToNextCheckpointKm: 1.976,
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
        completionPercent: 9.9,
        totalDistanceKm: 104.607,
        distanceToRouteMeters: 4,
        lastCheckpoint: {
          name: "Skiddaw",
          leg: "1",
          type: "summit",
          plannedArrivalIso: "2026-05-15T20:20:00.000Z",
          routeDistanceKm: 8.176,
        },
        nextCheckpoint: {
          name: "Great Calva",
          leg: "1",
          type: "summit",
          plannedArrivalIso: "2026-05-15T21:02:00.000Z",
          routeDistanceKm: 12.387,
        },
        distanceToNextCheckpointKm: 1.987,
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
      completionPercent: 14.7,
      totalDistanceKm: 104.607,
      distanceToRouteMeters: 6,
      lastCheckpoint: {
        name: "Great Calva",
        leg: "1",
        type: "summit",
        plannedArrivalIso: "2026-05-15T21:02:00.000Z",
        routeDistanceKm: 12.387,
      },
      nextCheckpoint: {
        name: "Blencathra",
        leg: "1",
        type: "summit",
        plannedArrivalIso: "2026-05-15T22:08:00.000Z",
        routeDistanceKm: 17.979,
      },
      distanceToNextCheckpointKm: 2.579,
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