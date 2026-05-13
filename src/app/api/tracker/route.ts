import { NextResponse } from "next/server";

import { getTrackerState } from "@/lib/tracker";

export async function GET() {
  try {
    return NextResponse.json(await getTrackerState());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load tracker state.",
      },
      { status: 500 },
    );
  }
}