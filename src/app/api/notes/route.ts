import { NextRequest, NextResponse } from "next/server";

import { listCrewNotes, saveCrewNote } from "@/lib/notes-store";

export async function GET() {
  return NextResponse.json({ notes: listCrewNotes() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<{
    name: string;
    crewNote: string;
  }>;

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (typeof body.crewNote !== "string") {
    return NextResponse.json({ error: "Crew note must be a string." }, { status: 400 });
  }

  const note = saveCrewNote(body.name, body.crewNote);

  return NextResponse.json({ note });
}