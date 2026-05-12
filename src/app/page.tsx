import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  CrosshairSimple,
  Drop,
  Snowflake,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import { WebcamCarousel } from "@/components/webcam-carousel";
import {
  changeoverLocations,
  checkpoints,
  pacerLegs,
  trackerUrl,
} from "@/data/bgr-data";
import { changeoverEntries } from "@/lib/changeovers";
import {
  formatClock,
  formatDayClock,
  formatDuration,
  getCheckpointStatus,
  getCountdown,
  getCrewPointSummary,
  getCrewPoints,
  getPlannedArrival,
  getRouteCompletion,
  getSummits,
  getUpcomingCheckpoints,
  raceCutoff,
  raceStart,
} from "@/lib/race";
import { describeWeatherCode, getWeatherSummaries } from "@/lib/weather";

const statCardClass =
  "rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur";

const sectionCardClass =
  "rounded-[1.75rem] border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur";

const keswickWebcamUrl = "https://view.h264.cam/ref/kta/live";
const blencathraWebcamUrl = "https://view.h264.cam/ref/blencathra/live";
const greatGableWebcamUrl = "https://www.wasdale.com/17.html";

const dashboardWebcams = [
  {
    name: "Keswick",
    title: "Market Square",
    url: keswickWebcamUrl,
    description: "Live town-centre conditions near Moot Hall from Keswick.net.",
  },
  // {
  //   name: "Great Gable",
  //   title: "Wasdale Head view",
  //   url: greatGableWebcamUrl,
  //   description:
  //     "Great Gable view from Wasdale Head Inn. Cloud on Gable can make conditions look worse than nearby fells.",
  // },
  {
    name: "Blencathra",
    title: "Blencathra",
    url: blencathraWebcamUrl,
    description: "Live Blencathra conditions from the Keswick.net webcam feed.",
  },
] as const;

function getWeatherConditionIcon(code: number | null) {
  if (code === null) {
    return <Cloud size={14} weight="bold" aria-hidden="true" />;
  }

  if (code === 0) {
    return <Sun size={14} weight="bold" aria-hidden="true" />;
  }

  if ([1, 2, 3].includes(code)) {
    return <CloudSun size={14} weight="bold" aria-hidden="true" />;
  }

  if ([45, 48].includes(code)) {
    return <CloudFog size={14} weight="bold" aria-hidden="true" />;
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return <Drop size={14} weight="bold" aria-hidden="true" />;
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return <CloudRain size={14} weight="bold" aria-hidden="true" />;
  }

  if ([71, 73, 75, 77].includes(code)) {
    return <Snowflake size={14} weight="bold" aria-hidden="true" />;
  }

  if ([95, 96, 99].includes(code)) {
    return <CloudLightning size={14} weight="bold" aria-hidden="true" />;
  }

  return <Cloud size={14} weight="bold" aria-hidden="true" />;
}

export default async function Home() {
  const now = new Date();
  const countdown = getCountdown(now);
  const nextCrewPoint = getCrewPointSummary(now);
  const upcomingCheckpoints = getUpcomingCheckpoints(now, 5);
  const summitCheckpoints = getSummits();
  const crewPoints = getCrewPoints();
  const weather = await getWeatherSummaries();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.22),_transparent_18%),linear-gradient(180deg,_#fff8ef_0%,_#f8fbff_38%,_#eef6ff_100%)] pb-20 text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.35),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.22),transparent_20%),radial-gradient(circle_at_55%_0%,rgba(34,197,94,0.18),transparent_18%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
            <details className="group absolute right-6 top-6 z-20 shrink-0">
              <summary className="flex list-none cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/8 p-3 text-white/90 transition hover:bg-white/14 [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Open crew points menu</span>
                <span className="flex h-5 w-5 flex-col justify-between">
                  <span className="block h-0.5 rounded-full bg-current" />
                  <span className="block h-0.5 rounded-full bg-current" />
                  <span className="block h-0.5 rounded-full bg-current" />
                </span>
              </summary>

              <div className="absolute right-0 top-full z-20 mt-3 w-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/96 p-3 shadow-[0_24px_80px_rgba(2,8,23,0.48)] backdrop-blur">
                <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                  Crew points
                </p>
                <div className="mt-2 grid gap-2">
                  {changeoverEntries.map((entry) => {
                    const checkpoint = crewPoints.find(
                      (item) => item.name === entry.location.name
                    );

                    return (
                      <Link
                        key={entry.slug}
                        href={`/changeovers/${entry.slug}`}
                        className="rounded-2xl border border-white/8 bg-white/6 px-3 py-3 text-left transition hover:border-sky-300/30 hover:bg-sky-400/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-white">
                            {entry.location.name}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                            {checkpoint
                              ? formatClock(getPlannedArrival(checkpoint))
                              : "Stop"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </details>

            <div className="pr-16 sm:pr-20">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/90">
                <span>Bob Graham Round</span>
              </div>
            </div>

            <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_340px] xl:items-start">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between xl:block">
                <div>
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Eugene&apos;s Bob Graham Round
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Live timings, tracker access, crew notes, pacers, and
                    weather in one race-day view.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-5 py-4 backdrop-blur xl:mt-6 xl:max-w-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                    {countdown.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {countdown.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {countdown.detail}
                  </p>
                </div>
              </div>

              <div className="relative mx-auto hidden w-full max-w-[340px] xl:block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-[0_24px_80px_rgba(2,8,23,0.42)]">
                  <Image
                    src="/IMG_5136.JPG"
                    alt="View across the Bob Graham fells with dramatic cloud and rocky foreground"
                    fill
                    className="object-cover"
                    priority
                    sizes="340px"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.12)_55%,rgba(15,23,42,0.38)_100%)]" />
                </div>

                <div className="absolute -bottom-8 -left-10 w-[58%] rotate-[-7deg] overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src="/eef0cbf4-ed1d-4c69-b295-7a618e2f772e.JPG"
                      alt="Descending rocky fellside with lake and valley views"
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                </div>

                <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-slate-950/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/90 backdrop-blur">
                  On the fells
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                  Start
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatDayClock(raceStart)}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Moot Hall, Keswick
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                  Cutoff
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatDayClock(raceCutoff)}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  24-hour round limit
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                  Plan
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatDuration(1317)}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  22-hour schedule with margin
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <article
              className={`${sectionCardClass} overflow-hidden border-sky-200/80 bg-sky-50/90`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                    Live tracker
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950"></h2>
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
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <iframe
                  title="Trail Live tracker"
                  src={trackerUrl}
                  className="h-[480px] w-full"
                />
              </div>
            </article>
            <WebcamCarousel
              webcams={[...dashboardWebcams]}
              className={`${statCardClass} border-sky-200/80 bg-sky-50/90`}
            />
            <article
              className={`${statCardClass} border-sky-200/80 bg-sky-50/90`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                Next crew point
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {nextCrewPoint.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {nextCrewPoint.detail}
              </p>
            </article>
            <article
              className={`${statCardClass} border-pink-200/80 bg-pink-50/90`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-700">
                Route completion
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {getRouteCompletion(now)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Progress is currently plan-based until tracker checkpoint
                ingestion is added.
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <article
              className={`${sectionCardClass} border-amber-200/80 bg-amber-50/90`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                Upcoming on plan
              </p>
              <div className="mt-4 space-y-3">
                {upcomingCheckpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-100/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {checkpoint.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        Leg {checkpoint.leg}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatClock(getPlannedArrival(checkpoint))}
                      </p>
                      <p className="text-sm text-slate-600">
                        +{formatDuration(checkpoint.cumulativeMinutes)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article
            className={`${sectionCardClass} border-emerald-200/80 bg-emerald-50/90`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Fell tops
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  ETA and actual arrival
                </h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {summitCheckpoints.length} tops
              </span>
            </div>

            <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {summitCheckpoints.map((checkpoint) => (
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
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                      {getCheckpointStatus(checkpoint, now)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl bg-emerald-100/75 p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        ETA
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatClock(getPlannedArrival(checkpoint))}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-100/75 p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Actual
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {checkpoint.actualArrival ?? "Waiting for tracker"}
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
              ))}
            </div>
          </article>

          <article
            className={`${sectionCardClass} border-violet-200/80 bg-violet-50/90`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-700">
              Pacers by leg
            </p>
            <div className="mt-4 grid gap-3">
              {pacerLegs.map((leg) => (
                <div
                  key={leg.leg}
                  className="rounded-2xl border border-violet-100 bg-violet-100/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Leg {leg.leg}
                    </h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                      {leg.pacers.length} pacers
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {leg.pacers.map((pacer) => (
                      <div
                        key={pacer}
                        className="rounded-xl border border-violet-200/80 bg-white/90 px-3 py-2 text-sm font-semibold leading-6 text-slate-900 shadow-[0_8px_20px_rgba(76,29,149,0.06)]"
                      >
                        {pacer}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section>
          <article
            className={`${sectionCardClass} border-cyan-200/80 bg-cyan-50/90`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
              Weather Forecast
            </p>

            <div className="mt-4 grid gap-3">
              {weather.map((forecast) => (
                <div
                  key={forecast.name}
                  className="rounded-2xl border border-cyan-100 bg-cyan-100/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">
                      {forecast.name}
                    </h3>
                    <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-800">
                      {getWeatherConditionIcon(forecast.weatherCode)}
                      {describeWeatherCode(forecast.weatherCode)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Temp
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {forecast.temperature === null
                          ? "--"
                          : `${Math.round(forecast.temperature)}°C`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Feels
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {forecast.apparentTemperature === null
                          ? "--"
                          : `${Math.round(forecast.apparentTemperature)}°C`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Wind
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {forecast.windSpeed === null
                          ? "--"
                          : `${Math.round(forecast.windSpeed)} km/h`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Rain
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {forecast.precipitationProbability === null
                          ? "--"
                          : `${Math.round(forecast.precipitationProbability)}%`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section
          className={`${sectionCardClass} flex flex-col gap-3 border-slate-200/80 bg-slate-100/80 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Data coverage
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Loaded {checkpoints.length} route checkpoints,{" "}
              {changeoverLocations.length} crew locations, and{" "}
              {pacerLegs.length} pacer legs from the published planning sheet.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            Tracker ingestion and shared notes database are the next
            implementation slices.
          </div>
        </section>
      </div>
    </main>
  );
}
