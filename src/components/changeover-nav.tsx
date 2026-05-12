import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
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
  direction,
}: {
  href: string;
  label: string;
  title: string;
  direction: "previous" | "next";
}) {
  const className =
    "flex min-h-18 w-full rounded-[1.5rem] border border-slate-200 bg-white/90 px-3 py-3 text-left text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:border-sky-200 hover:bg-sky-50";

  const inner = (
    <div className="flex items-center justify-between gap-3">
      {direction === "previous" ? (
        <CaretLeft
          size={22}
          weight="bold"
          className="shrink-0 text-sky-700"
          aria-hidden="true"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {label}
        </span>
        <span className="mt-1 text-sm font-semibold leading-5">{title}</span>
      </div>
      {direction === "next" ? (
        <CaretRight
          size={22}
          weight="bold"
          className="shrink-0 text-sky-700"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function ChangeoverNav({ previous, next }: Props) {
  type NavItem = {
    href: string;
    label: string;
    title: string;
    direction: "previous" | "next";
  };

  const items = [
    previous
      ? {
          href: `/changeovers/${previous.slug}`,
          label: "Previous",
          title: previous.location.name,
          direction: "previous" as const,
        }
      : null,
    next
      ? {
          href: `/changeovers/${next.slug}`,
          label: "Next",
          title: next.location.name,
          direction: "next" as const,
        }
      : null,
  ].filter((item): item is NavItem => item !== null);

  if (items.length === 0) {
    return null;
  }

  const singleItemClass =
    items.length === 1
      ? items[0].direction === "next"
        ? "grid-cols-1 max-w-[calc(50%-0.375rem)] ml-auto"
        : "grid-cols-1 max-w-[calc(50%-0.375rem)]"
      : "grid-cols-2";

  return (
    <nav
      className={`grid gap-3 ${singleItemClass}`}
      aria-label="Changeover navigation"
    >
      {items.map((item) => (
        <NavButton
          key={item.direction}
          href={item.href}
          label={item.label}
          title={item.title}
          direction={item.direction}
        />
      ))}
    </nav>
  );
}
