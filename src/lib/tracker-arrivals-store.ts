import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { hasPostgresConfig, sql } from "@/lib/db";

export type StoredTrackerArrival = {
  checkpointName: string;
  arrivedAt: string;
};

type TrackerArrivalRow = {
  checkpoint_name: string;
  arrived_at: string | Date;
};

const trackerArrivalsFilePath = path.join(
  process.cwd(),
  ".data",
  "tracker-arrivals.json",
);

const globalState = globalThis as typeof globalThis & {
  __bgrTrackerArrivalsSchemaReady?: Promise<void>;
};

function mapRow(row: TrackerArrivalRow): StoredTrackerArrival {
  return {
    checkpointName: row.checkpoint_name,
    arrivedAt:
      row.arrived_at instanceof Date
        ? row.arrived_at.toISOString()
        : new Date(row.arrived_at).toISOString(),
  };
}

async function ensureTrackerArrivalsTable() {
  if (!globalState.__bgrTrackerArrivalsSchemaReady) {
    globalState.__bgrTrackerArrivalsSchemaReady = sql`
      create table if not exists tracker_checkpoint_arrivals (
        checkpoint_name text primary key,
        arrived_at timestamptz not null
      )
    `
      .then(
        () => sql`
          create index if not exists tracker_checkpoint_arrivals_arrived_at_idx
            on tracker_checkpoint_arrivals (arrived_at asc)
        `,
      )
      .then(() => undefined);
  }

  await globalState.__bgrTrackerArrivalsSchemaReady;
}

async function readDevTrackerArrivalsFile() {
  try {
    const fileContents = await readFile(trackerArrivalsFilePath, "utf8");
    return JSON.parse(fileContents) as StoredTrackerArrival[];
  } catch {
    return [];
  }
}

async function writeDevTrackerArrivalsFile(arrivals: StoredTrackerArrival[]) {
  await mkdir(path.dirname(trackerArrivalsFilePath), { recursive: true });
  await writeFile(trackerArrivalsFilePath, JSON.stringify(arrivals, null, 2));
}

async function listTrackerArrivalsFromPostgres() {
  await ensureTrackerArrivalsTable();

  const result = await sql<TrackerArrivalRow>`
    select checkpoint_name, arrived_at
    from tracker_checkpoint_arrivals
    order by arrived_at asc
  `;

  return result.rows.map(mapRow);
}

async function upsertTrackerArrivalsToPostgres(arrivals: StoredTrackerArrival[]) {
  await ensureTrackerArrivalsTable();

  for (const arrival of arrivals) {
    await sql`
      insert into tracker_checkpoint_arrivals (checkpoint_name, arrived_at)
      values (${arrival.checkpointName}, ${arrival.arrivedAt})
      on conflict (checkpoint_name)
      do update set arrived_at = least(
        tracker_checkpoint_arrivals.arrived_at,
        excluded.arrived_at
      )
    `;
  }
}

async function listTrackerArrivalsFromDevFile() {
  return readDevTrackerArrivalsFile();
}

async function upsertTrackerArrivalsToDevFile(arrivals: StoredTrackerArrival[]) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const existingArrivals = await readDevTrackerArrivalsFile();
  const arrivalsByCheckpoint = new Map(
    existingArrivals.map((arrival) => [arrival.checkpointName, arrival]),
  );

  for (const arrival of arrivals) {
    const existing = arrivalsByCheckpoint.get(arrival.checkpointName);

    if (!existing || existing.arrivedAt > arrival.arrivedAt) {
      arrivalsByCheckpoint.set(arrival.checkpointName, arrival);
    }
  }

  const nextArrivals = Array.from(arrivalsByCheckpoint.values()).sort((left, right) =>
    left.arrivedAt.localeCompare(right.arrivedAt),
  );
  await writeDevTrackerArrivalsFile(nextArrivals);
}

export async function listTrackerArrivals() {
  if (hasPostgresConfig()) {
    return listTrackerArrivalsFromPostgres();
  }

  return listTrackerArrivalsFromDevFile();
}

export async function upsertTrackerArrivals(arrivals: StoredTrackerArrival[]) {
  if (arrivals.length === 0) {
    return;
  }

  if (hasPostgresConfig()) {
    await upsertTrackerArrivalsToPostgres(arrivals);
    return;
  }

  await upsertTrackerArrivalsToDevFile(arrivals);
}