import { NextResponse } from "next/server";

import { getMockTrackerState, parseMockTrackerStage } from "@/lib/tracker-mock";
import { getTrackerState } from "@/lib/tracker";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mockStage = parseMockTrackerStage(searchParams.get("mockStage"));

    return NextResponse.json(
      mockStage === null ? await getTrackerState() : getMockTrackerState(mockStage),
    );
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