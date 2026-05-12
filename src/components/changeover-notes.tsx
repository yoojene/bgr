"use client";

import { useCallback, useEffect, useState } from "react";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

import type { ChangeoverLocation } from "@/data/bgr-data";

type Props = {
  location: ChangeoverLocation;
};

type NoteStatus = "idle" | "saving" | "saved" | "error";

type SharedNote = {
  id: string;
  checkpointName: string;
  authorName: string;
  crewNote: string;
  updatedAt: string | null;
};

export function ChangeoverNotes({ location }: Props) {
  const draftStorageKey = `crew-note-draft:${location.name}`;
  const authorStorageKey = `crew-note-author:${location.name}`;
  const [crewNote, setCrewNote] = useState<string>(
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(draftStorageKey) ?? "")
  );
  const [authorName, setAuthorName] = useState<string>(
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(authorStorageKey) ?? "")
  );
  const [noteStatus, setNoteStatus] = useState<NoteStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<SharedNote[]>([]);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);

  const activeSavedNote = savedNotes[activeNoteIndex] ?? null;

  const syncSavedNotes = useCallback((notes: SharedNote[]) => {
    const nextNotes = notes
      .filter(
        (note) =>
          note.checkpointName === location.name && note.crewNote.trim().length > 0,
      )
      .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));

    setSavedNotes(nextNotes);

    if (nextNotes.length === 0) {
      setActiveNoteIndex(0);
      return;
    }

    setActiveNoteIndex((currentIndex) => Math.min(currentIndex, nextNotes.length - 1));
  }, [location.name]);

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

        syncSavedNotes(payload.notes);

        const savedNote = payload.notes
          .filter((note) => note.checkpointName === location.name)
          .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""))[0];

        if (savedNote?.crewNote) {
          setCrewNote(savedNote.crewNote);
        }

        setLastSavedAt(savedNote?.updatedAt ?? null);
      } catch {
        if (!cancelled) {
          setNoteStatus("error");
        }
      }
    }

    void loadSharedNotes();

    return () => {
      cancelled = true;
    };
  }, [location.name, syncSavedNotes]);

  async function saveNote() {
    if (!authorName.trim()) {
      setNoteStatus("error");
      return;
    }

    setNoteStatus("saving");

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkpointName: location.name,
          authorName: authorName.trim(),
          crewNote,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save note");
      }

      const payload = (await response.json()) as { note: SharedNote };
      window.localStorage.setItem(authorStorageKey, authorName.trim());
      syncSavedNotes([...savedNotes, payload.note]);
      setActiveNoteIndex(0);
      setLastSavedAt(payload.note.updatedAt);
      setCrewNote("");
      window.localStorage.removeItem(draftStorageKey);
      setNoteStatus("saved");
    } catch {
      window.localStorage.setItem(draftStorageKey, crewNote);
      window.localStorage.setItem(authorStorageKey, authorName.trim());
      setNoteStatus("error");
    }
  }

  function showPreviousSavedNote() {
    setActiveNoteIndex((currentIndex) =>
      currentIndex === 0 ? savedNotes.length - 1 : currentIndex - 1,
    );
  }

  function showNextSavedNote() {
    setActiveNoteIndex((currentIndex) =>
      currentIndex === savedNotes.length - 1 ? 0 : currentIndex + 1,
    );
  }

  return (
    <article className="rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <dl className="grid gap-4 text-sm text-slate-700 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/90 p-5 shadow-[0_12px_35px_rgba(14,165,233,0.12)]">
          <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Runner note
          </dt>
          <dd className="mt-3 text-base font-medium leading-7 text-slate-900">
            {location.runnerNote}
          </dd>
        </div>
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/90 p-5 shadow-[0_12px_35px_rgba(244,63,94,0.12)]">
          <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
            Crew logistics
          </dt>
          <dd className="mt-3 whitespace-pre-line text-base leading-7 text-slate-900">
            {location.notes}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 p-4 shadow-[0_12px_35px_rgba(16,185,129,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Saved crew notes
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              {activeSavedNote
                ? `${activeSavedNote.authorName}${savedNotes.length > 1 ? ` • ${activeNoteIndex + 1}/${savedNotes.length}` : ""}`
                : "Saved notes will appear here after the first successful save."}
            </p>
          </div>
          {savedNotes.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900"
                onClick={showPreviousSavedNote}
                aria-label="Show previous saved note"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900"
                onClick={showNextSavedNote}
                aria-label="Show next saved note"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm leading-7 text-slate-900">
          {activeSavedNote ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {activeSavedNote.authorName}
              </p>
              <p className="whitespace-pre-line">{activeSavedNote.crewNote}</p>
              <p className="mt-3 text-xs text-slate-600">
                Saved {" "}
                {activeSavedNote.updatedAt
                  ? new Date(activeSavedNote.updatedAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "recently"}
              </p>
            </>
          ) : (
            <p className="text-slate-600">
              No shared crew notes saved yet for this stop.
            </p>
          )}
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-800">
        Your name
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Add your name so the crew knows who left the note."
          value={authorName}
          onChange={(event) => {
            const nextAuthorName = event.target.value;
            setAuthorName(nextAuthorName);
            window.localStorage.setItem(authorStorageKey, nextAuthorName);
          }}
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-800">
        Crew note
        <textarea
          className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Add anything the crew should remember here."
          value={crewNote}
          onChange={(event) => {
            const nextCrewNote = event.target.value;
            setCrewNote(nextCrewNote);
            window.localStorage.setItem(draftStorageKey, nextCrewNote);
          }}
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>
          {lastSavedAt
            ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Not saved yet"}
        </span>
        <div className="flex items-center gap-3">
          <span>
            {noteStatus === "saving"
              ? "Saving..."
              : noteStatus === "saved"
                ? "Saved"
                : noteStatus === "error"
                  ? authorName.trim().length === 0
                    ? "Add your name to save"
                    : "Saved locally only"
                  : "Draft"}
          </span>
          <button
            type="button"
            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => void saveNote()}
            disabled={noteStatus === "saving" || crewNote.trim().length === 0}
          >
            Add note
          </button>
        </div>
      </div>
    </article>
  );
}
