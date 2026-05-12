import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { hasPostgresConfig, sql } from "@/lib/db";

export type StoredCrewNote = {
  id: string;
  checkpointName: string;
  authorName: string;
  crewNote: string;
  updatedAt: string | null;
};

type CrewNoteRow = {
  id: string;
  checkpoint_name: string;
  author_name: string;
  crew_note: string;
  updated_at: string | Date;
};

type LegacyStoredCrewNote = {
  name: string;
  crewNote: string;
  updatedAt: string | null;
};

const notesFilePath = path.join(process.cwd(), ".data", "crew-notes.json");

const globalState = globalThis as typeof globalThis & {
  __bgrCrewNotesSchemaReady?: Promise<void>;
};

function mapRow(row: CrewNoteRow): StoredCrewNote {
  return {
    id: row.id,
    checkpointName: row.checkpoint_name,
    authorName: row.author_name,
    crewNote: row.crew_note,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  };
}

async function ensureNotesTable() {
  if (!globalState.__bgrCrewNotesSchemaReady) {
    globalState.__bgrCrewNotesSchemaReady = sql`
      create table if not exists crew_notes (
        id text primary key,
        checkpoint_name text not null,
        author_name text not null,
        crew_note text not null default '',
        updated_at timestamptz not null default now()
      );

      create index if not exists crew_notes_checkpoint_name_idx
        on crew_notes (checkpoint_name, updated_at desc)
    `.then(() => undefined);
  }

  await globalState.__bgrCrewNotesSchemaReady;
}

async function readDevNotesFile() {
  try {
    const fileContents = await readFile(notesFilePath, "utf8");
    const parsed = JSON.parse(fileContents) as Array<StoredCrewNote | LegacyStoredCrewNote>;

    return parsed.map((note) => {
      if ("checkpointName" in note && "authorName" in note && "id" in note) {
        return note;
      }

      return {
        id: `${note.name}:${note.updatedAt ?? "legacy"}`,
        checkpointName: note.name,
        authorName: "Crew",
        crewNote: note.crewNote,
        updatedAt: note.updatedAt,
      } satisfies StoredCrewNote;
    });
  } catch {
    return [];
  }
}

async function writeDevNotesFile(notes: StoredCrewNote[]) {
  await mkdir(path.dirname(notesFilePath), { recursive: true });
  await writeFile(notesFilePath, JSON.stringify(notes, null, 2));
}

async function listCrewNotesFromPostgres() {
  await ensureNotesTable();

  const result = await sql<CrewNoteRow>`
    select id, checkpoint_name, author_name, crew_note, updated_at
    from crew_notes
    order by checkpoint_name asc, updated_at desc
  `;

  return result.rows.map(mapRow);
}

async function saveCrewNoteToPostgres(
  checkpointName: string,
  authorName: string,
  crewNote: string,
) {
  await ensureNotesTable();

  const noteId = crypto.randomUUID();

  const result = await sql<CrewNoteRow>`
    insert into crew_notes (id, checkpoint_name, author_name, crew_note)
    values (${noteId}, ${checkpointName}, ${authorName}, ${crewNote})
    returning id, checkpoint_name, author_name, crew_note, updated_at
  `;

  return mapRow(result.rows[0]);
}

async function listCrewNotesFromDevFile() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Crew notes backend is not configured. Set POSTGRES_URL for production note persistence.",
    );
  }

  return readDevNotesFile();
}

async function saveCrewNoteToDevFile(
  checkpointName: string,
  authorName: string,
  crewNote: string,
) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Crew notes backend is not configured. Set POSTGRES_URL for production note persistence.",
    );
  }

  const notes = await readDevNotesFile();
  const nextValue: StoredCrewNote = {
    id: crypto.randomUUID(),
    checkpointName,
    authorName,
    crewNote,
    updatedAt: new Date().toISOString(),
  };

  const nextNotes = [...notes];
  nextNotes.push(nextValue);
  nextNotes.sort((left, right) => {
    const checkpointOrder = left.checkpointName.localeCompare(right.checkpointName);

    if (checkpointOrder !== 0) {
      return checkpointOrder;
    }

    return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
  });
  await writeDevNotesFile(nextNotes);

  return nextValue;
}

async function deleteCrewNoteFromPostgres(id: string, authorName: string) {
  await ensureNotesTable();

  const result = await sql<{ id: string }>`
    delete from crew_notes
    where id = ${id} and author_name = ${authorName}
    returning id
  `;

  return result.rows.length > 0;
}

async function deleteCrewNoteFromDevFile(id: string, authorName: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Crew notes backend is not configured. Set POSTGRES_URL for production note persistence.",
    );
  }

  const notes = await readDevNotesFile();
  const nextNotes = notes.filter(
    (note) => !(note.id === id && note.authorName === authorName),
  );

  if (nextNotes.length === notes.length) {
    return false;
  }

  await writeDevNotesFile(nextNotes);
  return true;
}

export async function listCrewNotes() {
  if (hasPostgresConfig()) {
    return listCrewNotesFromPostgres();
  }

  return listCrewNotesFromDevFile();
}

export async function saveCrewNote(
  checkpointName: string,
  authorName: string,
  crewNote: string,
) {
  if (hasPostgresConfig()) {
    return saveCrewNoteToPostgres(checkpointName, authorName, crewNote);
  }

  return saveCrewNoteToDevFile(checkpointName, authorName, crewNote);
}

export async function deleteCrewNote(id: string, authorName: string) {
  if (hasPostgresConfig()) {
    return deleteCrewNoteFromPostgres(id, authorName);
  }

  return deleteCrewNoteFromDevFile(id, authorName);
}