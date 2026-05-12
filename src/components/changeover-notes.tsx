"use client";

import { useEffect, useState } from "react";

import type { ChangeoverLocation } from "@/data/bgr-data";

type Props = {
  locations: ChangeoverLocation[];
};

type NoteStatus = "idle" | "saving" | "saved" | "error";

type SharedNote = {
  name: string;
  crewNote: string;
  updatedAt: string | null;
};

export function ChangeoverNotes({ locations }: Props) {
  const [crewNotes, setCrewNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      locations.map((location) => {
        const saved =
          typeof window === "undefined"
            ? ""
            : (window.localStorage.getItem(`crew-note:${location.name}`) ?? "");

        return [location.name, saved];
      })
    )
  );
  const [noteStatus, setNoteStatus] = useState<Record<string, NoteStatus>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Record<string, string | null>>(
    {}
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSharedNotes() {
      try {
        const response = await fetch("/api/notes", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load notes");
        }

        const payload = (await response.json()) as { notes: SharedNote[] };

        if (cancelled) {
          return;
        }

        setCrewNotes((current) => {
          const nextValue = { ...current };

          for (const note of payload.notes) {
            if (note.crewNote) {
              nextValue[note.name] = note.crewNote;
            }
          }

          return nextValue;
        });

        setLastSavedAt(
          Object.fromEntries(
            payload.notes.map((note) => [note.name, note.updatedAt])
          )
        );
      } catch {
        if (!cancelled) {
          setNoteStatus((current) => {
            const nextValue = { ...current };

            for (const location of locations) {
              nextValue[location.name] = current[location.name] ?? "error";
            }

            return nextValue;
          });
        }
      }
    }

    void loadSharedNotes();

    return () => {
      cancelled = true;
    };
  }, [locations]);

  async function saveNote(name: string) {
    const crewNote = crewNotes[name] ?? "";
    setNoteStatus((current) => ({ ...current, [name]: "saving" }));

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, crewNote }),
      });

      if (!response.ok) {
        throw new Error("Unable to save note");
      }

      const payload = (await response.json()) as { note: SharedNote };
      window.localStorage.setItem(`crew-note:${name}`, crewNote);
      setLastSavedAt((current) => ({
        ...current,
        [name]: payload.note.updatedAt,
      }));
      setNoteStatus((current) => ({ ...current, [name]: "saved" }));
    } catch {
      window.localStorage.setItem(`crew-note:${name}`, crewNote);
      setNoteStatus((current) => ({ ...current, [name]: "error" }));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {locations.map((location) => (
        <article
          key={location.name}
          className="rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                Changeover notes
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {location.name}
              </h3>
            </div>
            <a
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
              href={location.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Map
            </a>
          </div>

          <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-100/80 p-3">
              <dt className="font-semibold text-slate-900">Runner note</dt>
              <dd className="mt-1 leading-6">{location.runnerNote}</dd>
            </div>
            <div className="rounded-2xl bg-slate-100/80 p-3">
              <dt className="font-semibold text-slate-900">Crew logistics</dt>
              <dd className="mt-1 whitespace-pre-line leading-6">
                {location.notes}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Notes save through an app API now. The current store is
            server-memory backed, so a hosted database is still the next
            hardening step.
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-800">
            Crew note draft
            <textarea
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              placeholder="Add anything the crew should remember here."
              value={crewNotes[location.name] ?? ""}
              onChange={(event) => {
                const value = event.target.value;

                setCrewNotes((current) => ({
                  ...current,
                  [location.name]: value,
                }));
              }}
            />
          </label>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              {lastSavedAt[location.name]
                ? `Last saved ${new Date(
                    lastSavedAt[location.name] ?? ""
                  ).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Not saved yet"}
            </span>
            <div className="flex items-center gap-3">
              <span>
                {noteStatus[location.name] === "saving"
                  ? "Saving..."
                  : noteStatus[location.name] === "saved"
                    ? "Saved"
                    : noteStatus[location.name] === "error"
                      ? "Saved locally only"
                      : "Draft"}
              </span>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                onClick={() => void saveNote(location.name)}
                disabled={noteStatus[location.name] === "saving"}
              >
                Save note
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
