import {
  changeoverLocations,
  checkpoints,
  type ChangeoverLocation,
  type Checkpoint,
} from "@/data/bgr-data";
import { getNextCrewPoint } from "@/lib/race";

export type ChangeoverEntry = {
  slug: string;
  location: ChangeoverLocation;
  checkpoint: Checkpoint | null;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const changeoverEntries: ChangeoverEntry[] = changeoverLocations.map((location) => ({
  slug: slugify(location.name),
  location,
  checkpoint:
    checkpoints.find(
      (checkpoint) =>
        checkpoint.type === "changeover" && checkpoint.name === location.name,
    ) ?? null,
}));

export function getChangeoverEntry(slug: string) {
  return changeoverEntries.find((entry) => entry.slug === slug) ?? null;
}

export function getAdjacentChangeovers(slug: string) {
  const index = changeoverEntries.findIndex((entry) => entry.slug === slug);

  if (index === -1) {
    return {
      previous: null,
      next: null,
    };
  }

  return {
    previous: index > 0 ? changeoverEntries[index - 1] : null,
    next: index < changeoverEntries.length - 1 ? changeoverEntries[index + 1] : null,
  };
}

export function getDefaultChangeoverSlug(now = new Date()) {
  const nextCrewPoint = getNextCrewPoint(now);

  if (!nextCrewPoint) {
    return changeoverEntries[0]?.slug ?? "";
  }

  return (
    changeoverEntries.find((entry) => entry.location.name === nextCrewPoint.name)?.slug ??
    changeoverEntries[0]?.slug ??
    ""
  );
}