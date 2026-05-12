import { NextRequest, NextResponse } from "next/server";

import { deleteCrewNote, listCrewNotes, saveCrewNote } from "@/lib/notes-store";

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

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as Partial<{
    id: string;
    authorName: string;
  }>;

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "Note id is required." }, { status: 400 });
  }

  if (!body.authorName || typeof body.authorName !== "string") {
    return NextResponse.json({ error: "Author name is required." }, { status: 400 });
  }

  try {
    const deleted = await deleteCrewNote(body.id, body.authorName);

    if (!deleted) {
      return NextResponse.json(
        { error: "You can only delete your own note." },
        { status: 403 },
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete crew note.",
      },
      { status: 500 },
    );
  }
}