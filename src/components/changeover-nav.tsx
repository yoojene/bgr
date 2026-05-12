import Link from "next/link";

import type { ChangeoverEntry } from "@/lib/changeovers";

type Props = {
  previous: ChangeoverEntry | null;
  next: ChangeoverEntry | null;
};

function NavButton({
  href,
  label,
  title,
  align,
}: {
  href?: string;
  label: string;
  title: string;
  align: "left" | "right";
}) {
  const className =
    "flex min-h-20 flex-1 flex-col rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:border-sky-200 hover:bg-sky-50";

  const inner = (
    <>
      <span
        className={`text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-2 text-base font-semibold ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        {title}
      </span>
    </>
  );

  if (!href) {
    return (
      <div
        className={`${className} cursor-not-allowed opacity-45`}
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function ChangeoverNav({ previous, next }: Props) {
  return (
    <nav
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Changeover navigation"
    >
      <NavButton
        href={previous ? `/changeovers/${previous.slug}` : undefined}
        label="Previous"
        title={previous?.location.name ?? "Start of notes"}
        align="left"
      />
      <NavButton
        href={next ? `/changeovers/${next.slug}` : undefined}
        label="Next"
        title={next?.location.name ?? "Last changeover"}
        align="right"
      />
    </nav>
  );
}
