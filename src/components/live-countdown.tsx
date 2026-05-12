"use client";

import { useEffect, useState } from "react";

import { getCountdown } from "@/lib/race";

export function LiveCountdown() {
  const [countdown, setCountdown] = useState(() => getCountdown());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-5 py-4 backdrop-blur xl:mt-6 xl:max-w-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
        {countdown.label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white">{countdown.value}</p>
      <p className="mt-1 text-sm text-slate-300">{countdown.detail}</p>
    </div>
  );
}