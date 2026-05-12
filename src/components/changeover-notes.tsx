"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ChangeoverLocation } from "@/data/bgr-data";

type Props = {
  location: ChangeoverLocation;
  etaLabel?: string | null;
  actualArrival?: string | null;
};

type NoteStatus = "idle" | "saving" | "saved" | "error";

type SharedNote = {
  name: string;
  crewNote: string;
  updatedAt: string | null;
};

export function ChangeoverNotes({ location, etaLabel, actualArrival }: Props) {
  const [crewNote, setCrewNote] = useState<string>(
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(`crew-note:${location.name}`) ?? "")
  );
  const [noteStatus, setNoteStatus] = useState<NoteStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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

        const savedNote = payload.notes.find(
          (note) => note.name === location.name
        );

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
  }, [location.name]);

  async function saveNote() {
    setNoteStatus("saving");

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: location.name, crewNote }),
      });

      if (!response.ok) {
        throw new Error("Unable to save note");
      }

      const payload = (await response.json()) as { note: SharedNote };
      window.localStorage.setItem(`crew-note:${location.name}`, crewNote);
      setLastSavedAt(payload.note.updatedAt);
      setNoteStatus("saved");
    } catch {
      window.localStorage.setItem(`crew-note:${location.name}`, crewNote);
      setNoteStatus("error");
    }
  }

  return (
    <article className="rounded-[1.75rem] border border-white/60 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            Changeover notes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {location.name}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 transition hover:border-amber-300 hover:bg-amber-200"
            href={`https://what3words.com/${location.w3w.replace(/^\/\/\//, "")}`}
            target="_blank"
          >
            Open W3W
          </Link>
          <a
            className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 transition hover:border-amber-300 hover:bg-amber-200"
            href={location.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open map
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-100/80 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            ETA
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {etaLabel ?? "Optional stop"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100/80 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Actual
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {actualArrival ?? "Waiting for tracker"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100/80 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            What3words
          </p>
          <p className="mt-1 font-semibold text-slate-900">{location.w3w}</p>
        </div>
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
        Notes save through an app API now. The current store is server-memory
        backed, so a hosted database is still the next hardening step.
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-800">
        Crew note draft
        <textarea
          className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          placeholder="Add anything the crew should remember here."
          value={crewNote}
          onChange={(event) => {
            setCrewNote(event.target.value);
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
                  ? "Saved locally only"
                  : "Draft"}
          </span>
          <button
            type="button"
            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => void saveNote()}
            disabled={noteStatus === "saving"}
          >
            Save note
          </button>
        </div>
      </div>
    </article>
  );
}
