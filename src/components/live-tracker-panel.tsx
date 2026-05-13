"use client";

import { useEffect, useState } from "react";

import {
  BatteryChargingVertical,
  CrosshairSimple,
  Timer,
} from "@phosphor-icons/react/dist/ssr";

import { trackerUrl } from "@/data/bgr-data";
import { formatDayClock } from "@/lib/race";
import type { TrackerState } from "@/lib/tracker";

function getTrackerHeadline(status: TrackerState["status"]) {
  if (status === "live") {
    return "Tracker live";
  }

  if (status === "stale") {
    return "Tracker stale";
  }

  if (status === "retired") {
    return "Tracker retired";
  }

  if (status === "pre-start") {
    return "Awaiting first report";
  }

  return "Tracker unavailable";
}

function getFreshnessSummary(trackerState: TrackerState) {
  if (trackerState.status === "retired") {
    return {
      value: "Retired",
      detail: "Tracker has stopped because the round is marked retired.",
    };
  }

  if (!trackerState.lastUpdatedAt) {
    return {
      value: "Waiting",
      detail: `Polling every ${trackerState.reportIntervalSeconds} seconds for the first report.`,
    };
  }

  const minutesSinceUpdate = Math.max(
    0,
    Math.round(
      (Date.now() - new Date(trackerState.lastUpdatedAt).getTime()) / 60000
    )
  );

  if (trackerState.status === "stale") {
    return {
      value: `${minutesSinceUpdate} min old`,
      detail: "Later than expected for the configured tracker interval.",
    };
  }

  return {
    value:
      minutesSinceUpdate === 0 ? "Live now" : `${minutesSinceUpdate} min ago`,
    detail: `Expected roughly every ${trackerState.reportIntervalSeconds} seconds.`,
  };
}

function getBatterySummary(battery: number | null) {
  if (battery === null) {
    return {
      value: "--",
      detail: "Battery level not reported by the device.",
    };
  }

  if (battery <= 20) {
    return {
      value: `${battery}%`,
      detail: "Low battery. Keep an eye on tracker longevity.",
    };
  }

  if (battery <= 50) {
    return {
      value: `${battery}%`,
      detail: "Mid battery. Still healthy, but no longer full.",
    };
  }

  return {
    value: `${battery}%`,
    detail: "Battery level looks healthy.",
  };
}

type Props = {
  initialState: TrackerState;
  className: string;
  requestSuffix?: string;
};

export function LiveTrackerPanel({
  initialState,
  className,
  requestSuffix = "",
}: Props) {
  const [trackerState, setTrackerState] = useState(initialState);
  const freshness = getFreshnessSummary(trackerState);
  const battery = getBatterySummary(trackerState.lastReport?.battery ?? null);

  useEffect(() => {
    let cancelled = false;

    async function refreshTrackerState() {
      try {
        const response = await fetch(`/api/tracker${requestSuffix}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to refresh tracker state");
        }

        const payload = (await response.json()) as TrackerState;

        if (!cancelled) {
          setTrackerState(payload);
        }
      } catch {
        return;
      }
    }

    void refreshTrackerState();

    const pollIntervalMilliseconds = Math.max(
      30000,
      trackerState.reportIntervalSeconds * 1000
    );
    const interval = window.setInterval(() => {
      void refreshTrackerState();
    }, pollIntervalMilliseconds);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [trackerState.reportIntervalSeconds, requestSuffix]);

  return (
    <article className={className}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            <CrosshairSimple size={14} weight="bold" aria-hidden="true" />
            Live tracker
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {getTrackerHeadline(trackerState.status)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {trackerState.lastUpdatedAt
              ? `Last report ${formatDayClock(new Date(trackerState.lastUpdatedAt))}`
              : ``}
          </p>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-950 transition hover:border-sky-300 hover:bg-sky-200"
          href={trackerUrl}
          target="_blank"
          rel="noreferrer"
        >
          <CrosshairSimple size={16} weight="bold" aria-hidden="true" />
          Open tracker
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-sky-200 bg-white p-4 shadow-[0_12px_28px_rgba(14,116,144,0.08)]">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Last checkpoint
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {trackerState.progress.lastCheckpoint?.name ?? "Not reached yet"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {trackerState.progress.lastCheckpoint?.plannedArrivalIso
              ? `Planned ${formatDayClock(new Date(trackerState.progress.lastCheckpoint.plannedArrivalIso))}`
              : "No checkpoint reached yet."}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-sky-200 bg-white p-4 shadow-[0_12px_28px_rgba(14,116,144,0.08)]">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Next checkpoint
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {trackerState.progress.nextCheckpoint?.name ??
              "Waiting for route progress"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {trackerState.progress.distanceToNextCheckpointKm === null
              ? "Distance will appear once route progress is available."
              : `${trackerState.progress.distanceToNextCheckpointKm.toFixed(1)} km to go.`}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
        <iframe
          title="Trail Live tracker"
          src={trackerUrl}
          className="h-[480px] w-full"
          allow="geolocation"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-sky-100/80 bg-white/75 px-4 py-3 text-sm text-slate-600">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <Timer size={14} weight="bold" aria-hidden="true" />
            Tracker Freshness
          </span>
          <span className="whitespace-nowrap font-semibold text-slate-900">
            {freshness.value}
          </span>
          <span>{freshness.detail}</span>
        </div>
        <div className="h-px w-full bg-sky-100/90" />
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <BatteryChargingVertical
              size={14}
              weight="bold"
              aria-hidden="true"
            />
            Battery
          </span>
          <span className="whitespace-nowrap font-semibold text-slate-900">
            {battery.value}
          </span>
          <span>{battery.detail}</span>
        </div>
      </div>
    </article>
  );
}
