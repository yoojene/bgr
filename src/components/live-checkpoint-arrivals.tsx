"use client";

import { useEffect, useState } from "react";

import type { Checkpoint } from "@/data/bgr-data";
import {
  formatClock,
  formatDayClock,
  formatDuration,
  getPlannedArrival,
} from "@/lib/race";
import type { StoredTrackerArrival } from "@/lib/tracker-arrivals-store";
import type { TrackerState } from "@/lib/tracker";

type Props = {
  checkpoints: Checkpoint[];
  initialArrivals: StoredTrackerArrival[];
  requestSuffix?: string;
};

function getRenderedCheckpointStatus(
  actualArrival: string | null,
  plannedArrival: Date,
  now: Date
) {
  if (actualArrival) {
    return "Reached";
  }

  const delta = Math.round((plannedArrival.getTime() - now.getTime()) / 60000);

  if (delta < 0) {
    return "Awaiting tracker";
  }

  if (delta <= 45) {
    return "Due soon";
  }

  return "Upcoming";
}

function getCheckpointStatusPillClasses(status: string) {
  if (status === "Reached") {
    return "bg-slate-900 text-white";
  }

  if (status === "Due soon") {
    return "bg-amber-100 text-amber-900";
  }

  if (status === "Awaiting tracker") {
    return "bg-rose-100 text-rose-900";
  }

  return "bg-emerald-100 text-emerald-800";
}

export function LiveCheckpointArrivals({
  checkpoints,
  initialArrivals,
  requestSuffix = "",
}: Props) {
  const [arrivals, setArrivals] = useState(initialArrivals);
  const [reportIntervalSeconds, setReportIntervalSeconds] = useState(120);
  const now = new Date();
  const arrivalsByCheckpoint = new Map(
    arrivals.map((arrival) => [arrival.checkpointName, arrival.arrivedAt])
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshTrackerState() {
      try {
        const response = await fetch(`/api/tracker${requestSuffix}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to refresh tracker arrivals");
        }

        const payload = (await response.json()) as TrackerState;

        if (!cancelled) {
          setArrivals(payload.arrivals);
          setReportIntervalSeconds(payload.reportIntervalSeconds);
        }
      } catch {
        return;
      }
    }

    void refreshTrackerState();

    const pollIntervalMilliseconds = Math.max(
      30000,
      reportIntervalSeconds * 1000
    );
    const interval = window.setInterval(() => {
      void refreshTrackerState();
    }, pollIntervalMilliseconds);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [reportIntervalSeconds, requestSuffix]);

  return (
    <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pr-1">
      {checkpoints.map((checkpoint) => {
        const actualArrival = arrivalsByCheckpoint.get(checkpoint.name) ?? null;
        const plannedArrival = getPlannedArrival(checkpoint);
        const status = getRenderedCheckpointStatus(
          actualArrival,
          plannedArrival,
          now
        );

        return (
          <div
            key={checkpoint.id}
            className="rounded-2xl border border-emerald-100 bg-white/90 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {checkpoint.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Leg {checkpoint.leg}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getCheckpointStatusPillClasses(
                  status
                )}`}
                data-testid={`checkpoint-status-${checkpoint.id}`}
              >
                {status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-100/75 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  ETA
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatClock(plannedArrival)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100/75 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Actual
                </p>
                <p
                  className="mt-1 font-semibold text-slate-900"
                  data-testid={`checkpoint-actual-${checkpoint.id}`}
                >
                  {actualArrival
                    ? formatDayClock(new Date(actualArrival))
                    : "Waiting for tracker"}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100/75 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Elapsed
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDuration(checkpoint.cumulativeMinutes)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
