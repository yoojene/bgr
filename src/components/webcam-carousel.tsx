"use client";

import { Camera, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

type WebcamItem = {
  name: string;
  title: string;
  url: string;
  description: string;
};

type Props = {
  webcams: WebcamItem[];
  className?: string;
};

export function WebcamCarousel({ webcams, className }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeWebcam = webcams[activeIndex];

  function goPrevious() {
    setActiveIndex((current) =>
      current === 0 ? webcams.length - 1 : current - 1,
    );
  }

  function goNext() {
    setActiveIndex((current) =>
      current === webcams.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <article className={className}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            Mountain webcams
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {activeWebcam.title}
          </h2>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-950 transition hover:border-sky-300 hover:bg-sky-200"
          href={activeWebcam.url}
          target="_blank"
          rel="noreferrer"
        >
          <Camera size={16} weight="bold" aria-hidden="true" />
          Open webcam
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
        <iframe
          key={activeWebcam.url}
          title={activeWebcam.title}
          src={activeWebcam.url}
          className="h-[280px] w-full"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{activeWebcam.name}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {activeWebcam.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
            onClick={goPrevious}
            aria-label="Show previous webcam"
          >
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
          <span className="min-w-14 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {activeIndex + 1}/{webcams.length}
          </span>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
            onClick={goNext}
            aria-label="Show next webcam"
          >
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}