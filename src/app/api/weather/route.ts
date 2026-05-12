import { NextResponse } from "next/server";

import { getWeatherSummaries } from "@/lib/weather";

export async function GET() {
  const summaries = await getWeatherSummaries();

  return NextResponse.json({
    locations: summaries,
    provider: "open-meteo",
    fetchedAt: new Date().toISOString(),
  });
}