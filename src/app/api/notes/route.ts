import { NextRequest, NextResponse } from "next/server";

import { listCrewNotes, saveCrewNote } from "@/lib/notes-store";

export async function GET() {
  try {
    return NextResponse.json({ notes: await listCrewNotes() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load crew notes.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<{
    checkpointName: string;
    authorName: string;
    crewNote: string;
  }>;

  if (!body.checkpointName || typeof body.checkpointName !== "string") {
    return NextResponse.json({ error: "Checkpoint name is required." }, { status: 400 });
  }

  if (!body.authorName || typeof body.authorName !== "string") {
    return NextResponse.json({ error: "Author name is required." }, { status: 400 });
  }

  if (typeof body.crewNote !== "string") {
    return NextResponse.json({ error: "Crew note must be a string." }, { status: 400 });
  }

  try {
    const note = await saveCrewNote(body.checkpointName, body.authorName, body.crewNote);

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save crew note.",
      },
      { status: 500 },
    );
  }
}