import { getWeatherLocations } from "@/lib/race";

export type WeatherSummary = {
  name: string;
  kind: "crew" | "summit";
  temperature: number | null;
  apparentTemperature: number | null;
  windSpeed: number | null;
  precipitationProbability: number | null;
  weatherCode: number | null;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  hourly?: {
    precipitation_probability?: number[];
  };
};

export function describeWeatherCode(code: number | null) {
  if (code === null) {
    return "Unavailable";
  }

  if ([0].includes(code)) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";

  return "Mixed conditions";
}

export async function getWeatherSummaries(): Promise<WeatherSummary[]> {
  const locations = getWeatherLocations();

  const results = await Promise.all(
    locations.map(async (location) => {
      const query = new URLSearchParams({
        latitude: String(location.coordinates.latitude),
        longitude: String(location.coordinates.longitude),
        current: [
          "temperature_2m",
          "apparent_temperature",
          "wind_speed_10m",
          "weather_code",
        ].join(","),
        hourly: "precipitation_probability",
        forecast_days: "1",
      });

      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
          next: { revalidate: 900 },
        });

        if (!response.ok) {
          throw new Error(`Weather request failed for ${location.name}`);
        }

        const data = (await response.json()) as OpenMeteoResponse;

        return {
          name: location.name,
          kind: location.kind,
          temperature: data.current?.temperature_2m ?? null,
          apparentTemperature: data.current?.apparent_temperature ?? null,
          windSpeed: data.current?.wind_speed_10m ?? null,
          precipitationProbability: data.hourly?.precipitation_probability?.[0] ?? null,
          weatherCode: data.current?.weather_code ?? null,
        } satisfies WeatherSummary;
      } catch {
        return {
          name: location.name,
          kind: location.kind,
          temperature: null,
          apparentTemperature: null,
          windSpeed: null,
          precipitationProbability: null,
          weatherCode: null,
        } satisfies WeatherSummary;
      }
    }),
  );

  return results;
}