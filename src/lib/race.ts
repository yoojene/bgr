import {
  changeoverLocations,
  checkpoints,
  raceCutoffHours,
  raceStartIso,
  type Checkpoint,
} from "@/data/bgr-data";

export const raceStart = new Date(raceStartIso);
export const raceCutoff = new Date(
  raceStart.getTime() + raceCutoffHours * 60 * 60 * 1000,
);

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function formatClock(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDayClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

export function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours}h ${pad(mins)}m`;
}

export function getPlannedArrival(checkpoint: Checkpoint) {
  return addMinutes(raceStart, checkpoint.cumulativeMinutes);
}

export function getCountdown(now = new Date()) {
  const minutesToStart = Math.round((raceStart.getTime() - now.getTime()) / 60000);
  if (minutesToStart <= 0) {
    const minutesSinceStart = Math.round((now.getTime() - raceStart.getTime()) / 60000);
    const minutesToCutoff = Math.round((raceCutoff.getTime() - now.getTime()) / 60000);

    return {
      label: minutesToCutoff > 0 ? "Time Remaining" : "Cutoff Passed",
      value:
        minutesToCutoff > 0
          ? formatDuration(minutesToCutoff)
          : `${formatDuration(Math.abs(minutesToCutoff))} over`,
      detail: `Elapsed ${formatDuration(minutesSinceStart)}`,
    };
  }

  return {
    label: "Start Countdown",
    value: formatDuration(minutesToStart),
    detail: `${formatDayClock(raceStart)} at Moot Hall`,
  };
}

export function getUpcomingCheckpoints(now = new Date(), limit = 6) {
  return checkpoints
    .filter((checkpoint) => getPlannedArrival(checkpoint).getTime() >= now.getTime())
    .slice(0, limit);
}

export function getNextCrewPoint(now = new Date()) {
  return checkpoints.find(
    (checkpoint) =>
      checkpoint.type === "changeover" &&
      getPlannedArrival(checkpoint).getTime() >= now.getTime(),
  );
}

export function getCrewPointSummary(now = new Date()) {
  const nextCrewPoint = getNextCrewPoint(now);

  if (!nextCrewPoint) {
    return {
      title: "All crew points passed",
      detail: "Final stretch to Keswick.",
    };
  }

  const minutesAway = Math.round(
    (getPlannedArrival(nextCrewPoint).getTime() - now.getTime()) / 60000,
  );

  return {
    title: nextCrewPoint.name,
    detail:
      minutesAway > 0
        ? `${formatDuration(minutesAway)} away on plan`
        : `${formatDuration(Math.abs(minutesAway))} overdue on plan`,
  };
}

export function getSummits() {
  return checkpoints.filter((checkpoint) => checkpoint.type === "summit");
}

export function getCrewPoints() {
  return checkpoints.filter((checkpoint) => checkpoint.type === "changeover");
}

export function getCheckpointStatus(checkpoint: Checkpoint, now = new Date()) {
  if (checkpoint.actualArrival) {
    return "Reached";
  }

  const delta = Math.round((getPlannedArrival(checkpoint).getTime() - now.getTime()) / 60000);

  if (delta < 0) {
    return "Awaiting tracker";
  }

  if (delta <= 45) {
    return "Due soon";
  }

  return "Upcoming";
}

export function getRouteCompletion(now = new Date()) {
  const elapsedMinutes = Math.max(0, Math.round((now.getTime() - raceStart.getTime()) / 60000));
  const plannedTotal = checkpoints[checkpoints.length - 1]?.cumulativeMinutes ?? 1;
  const percent = Math.min(100, Math.max(0, (elapsedMinutes / plannedTotal) * 100));
  return `${percent.toFixed(1)}%`;
}

export function getWeatherLocations() {
  return changeoverLocations.filter((location) => location.name !== "Newlands Church");
}