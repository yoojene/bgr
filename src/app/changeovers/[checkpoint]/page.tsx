import {
  CaretLeft,
  MapPinLine,
  MapTrifold,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChangeoverNav } from "@/components/changeover-nav";
import { ChangeoverNotes } from "@/components/changeover-notes";
import { getAdjacentChangeovers, getChangeoverEntry } from "@/lib/changeovers";
import { formatClock, formatDuration, getPlannedArrival } from "@/lib/race";

type PageProps = {
  params: Promise<{
    checkpoint: string;
  }>;
};

export default async function ChangeoverPage({ params }: PageProps) {
  const { checkpoint } = await params;
  const entry = getChangeoverEntry(checkpoint);

  if (!entry) {
    notFound();
  }

  const adjacent = getAdjacentChangeovers(checkpoint);
  const plannedArrival = entry.checkpoint
    ? getPlannedArrival(entry.checkpoint)
    : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_18%),linear-gradient(180deg,_#fff8ef_0%,_#f8fbff_42%,_#eef6ff_100%)] pb-20 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/90 transition hover:text-white"
              >
                <CaretLeft size={16} weight="bold" aria-hidden="true" />
                Back to dashboard
              </Link>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {entry.location.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <a
                className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-200/50 hover:bg-amber-200/20 hover:text-white"
                href={entry.location.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapTrifold size={14} weight="bold" aria-hidden="true" />
                Open map
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                ETA
              </p>
              <p className="mt-2 text-xl font-semibold">
                {plannedArrival ? formatClock(plannedArrival) : "Optional stop"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {entry.checkpoint
                  ? `Planned ${formatDuration(entry.checkpoint.cumulativeMinutes)}`
                  : "No fixed schedule checkpoint"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                Actual
              </p>
              <p className="mt-2 text-xl font-semibold">
                {entry.checkpoint?.actualArrival ?? "Waiting for tracker"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Manual override can slot in here later
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                Location
              </p>
              <p className="mt-2 text-lg font-semibold">{entry.location.w3w}</p>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 mt-2 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-200/50 hover:bg-amber-200/20 hover:text-white"
                href={`https://what3words.com/${entry.location.w3w.replace(/^\/\/\//, "")}`}
                target="_blank"
              >
                <MapPinLine size={14} weight="bold" aria-hidden="true" />
                Open W3W
              </Link>
            </div>
          </div>
        </section>

        <ChangeoverNotes location={entry.location} />

        <ChangeoverNav previous={adjacent.previous} next={adjacent.next} />
      </div>
    </main>
  );
}
