export type CheckpointType =
  | "start"
  | "summit"
  | "changeover"
  | "departure"
  | "finish";

export type Checkpoint = {
  id: string;
  leg: string;
  name: string;
  legMinutes: number;
  cumulativeMinutes: number;
  plannedClockTime: string;
  type: CheckpointType;
  actualArrival: string | null;
};

export type PacerLeg = {
  leg: string;
  pacers: string[];
};

export type ChangeoverLocation = {
  name: string;
  w3w: string;
  mapsUrl: string;
  notes: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  runnerNote: string;
};

export type WeatherLocation = {
  name: string;
  kind: "crew" | "summit";
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

const rawSchedule = [
  ["1", "Moot Hall", 0, 0, "19:00:00"],
  ["1", "Skiddaw", 80, 80, "20:20:00"],
  ["1", "Great Calva", 42, 122, "21:02:00"],
  ["1", "Blencathra", 66, 188, "22:08:00"],
  ["1/2", "Threlkeld", 29, 217, "22:37:00"],
  ["1/2", "Threlkeld Depart", 14, 231, "22:51:00"],
  ["2", "Clough Head", 55, 286, "23:46:00"],
  ["2", "Great Dodd", 28, 314, "00:14:00"],
  ["2", "Watson's Dodd", 8, 322, "00:22:00"],
  ["2", "Stybarrow Dodd", 8, 330, "00:30:00"],
  ["2", "Raise", 17, 347, "00:47:00"],
  ["2", "White Side", 7, 354, "00:54:00"],
  ["2", "Lower Man", 17, 371, "01:11:00"],
  ["2", "Helvellyn", 6, 377, "01:17:00"],
  ["2", "Nethermost Pike", 9, 386, "01:26:00"],
  ["2", "Dollywagon Pike", 11, 397, "01:37:00"],
  ["2", "Fairfield", 39, 436, "02:16:00"],
  ["2", "Seat Sandal", 23, 459, "02:39:00"],
  ["2/3", "Dunmail Raise", 23, 482, "03:02:00"],
  ["2/3", "Dunmail Raise Depart", 14, 496, "03:16:00"],
  ["3", "Steel Fell", 23, 519, "03:39:00"],
  ["3", "Calf Crag", 19, 538, "03:58:00"],
  ["3", "Sergeant Man", 33, 571, "04:31:00"],
  ["3", "High Raise", 8, 579, "04:39:00"],
  ["3", "Thurnacar Knott", 14, 593, "04:53:00"],
  ["3", "Harrison Stickle", 9, 602, "05:02:00"],
  ["3", "Pike of Stickle", 11, 613, "05:13:00"],
  ["3", "Rossett Pike", 42, 655, "05:55:00"],
  ["3", "Bowfell", 33, 688, "06:28:00"],
  ["3", "Esk Pike", 23, 711, "06:51:00"],
  ["3", "Great End", 23, 734, "07:14:00"],
  ["3", "Ill Crag", 14, 748, "07:28:00"],
  ["3", "Broad Crag", 9, 757, "07:37:00"],
  ["3", "Scafell Pike", 11, 768, "07:48:00"],
  ["3", "Scafell", 30, 798, "08:18:00"],
  ["3/4", "Wasdale NT CP", 33, 831, "08:51:00"],
  ["3/4", "Wasdale Depart", 19, 850, "09:10:00"],
  ["4", "Yewbarrow", 47, 897, "09:57:00"],
  ["4", "Red Pike", 47, 944, "10:44:00"],
  ["4", "Steeple", 22, 966, "11:06:00"],
  ["4", "Pillar", 32, 998, "11:38:00"],
  ["4", "Kirk Fell", 47, 1045, "12:25:00"],
  ["4", "Great Gable", 40, 1085, "13:05:00"],
  ["4", "Green Gable", 14, 1099, "13:19:00"],
  ["4", "Brandreth", 17, 1116, "13:36:00"],
  ["4", "Grey Knotts", 7, 1123, "13:43:00"],
  ["4/5", "Honister Pass", 12, 1135, "13:55:00"],
  ["4/5", "Honister Pass Depart", 13, 1148, "14:08:00"],
  ["5", "Dale Head", 31, 1179, "14:39:00"],
  ["5", "Hindscarth", 20, 1199, "14:59:00"],
  ["5", "Robinson", 24, 1223, "15:23:00"],
  ["5", "Moot Hall", 94, 1317, "16:57:00"],
] as const;

const changeoverNames = new Set([
  "Threlkeld",
  "Dunmail Raise",
  "Wasdale NT CP",
  "Honister Pass",
  "Moot Hall",
]);

function toCheckpointType(name: string, index: number): CheckpointType {
  if (index === 0) {
    return "start";
  }

  if (name.endsWith("Depart")) {
    return "departure";
  }

  if (index === rawSchedule.length - 1) {
    return "finish";
  }

  if (changeoverNames.has(name)) {
    return "changeover";
  }

  return "summit";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const britishGridLetters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

function parseGridReference(gridReference: string) {
  const normalized = gridReference
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  const match = normalized.match(/^([A-Z]{2})\s*(\d{3})\s*(\d{3})$/);

  if (!match) {
    throw new Error(`Unsupported grid reference: ${gridReference}`);
  }

  const [, letters, eastingDigits, northingDigits] = match;
  const firstLetter = britishGridLetters.indexOf(letters[0]);
  const secondLetter = britishGridLetters.indexOf(letters[1]);

  if (firstLetter === -1 || secondLetter === -1) {
    throw new Error(`Invalid grid reference letters: ${gridReference}`);
  }

  const easting100km = (((firstLetter - 2 + 25) % 5) * 5) + (secondLetter % 5);
  const northing100km =
    19 - Math.floor(firstLetter / 5) * 5 - Math.floor(secondLetter / 5);

  return {
    easting: easting100km * 100000 + Number.parseInt(eastingDigits, 10) * 100,
    northing: northing100km * 100000 + Number.parseInt(northingDigits, 10) * 100,
  };
}

function osGridToLatLng(gridReference: string) {
  const { easting, northing } = parseGridReference(gridReference);
  const airyA = 6377563.396;
  const airyB = 6356256.909;
  const scaleFactor = 0.9996012717;
  const latOrigin = (49 * Math.PI) / 180;
  const lonOrigin = (-2 * Math.PI) / 180;
  const northingOrigin = -100000;
  const eastingOrigin = 400000;
  const airyE2 = 1 - (airyB * airyB) / (airyA * airyA);
  const airyN = (airyA - airyB) / (airyA + airyB);

  let latitude = latOrigin;
  let meridionalArc = 0;

  do {
    latitude = (northing - northingOrigin - meridionalArc) / (airyA * scaleFactor) + latitude;
    const ma =
      (1 + airyN + (5 / 4) * airyN ** 2 + (5 / 4) * airyN ** 3) *
      (latitude - latOrigin);
    const mb =
      (3 * airyN + 3 * airyN ** 2 + (21 / 8) * airyN ** 3) *
      Math.sin(latitude - latOrigin) *
      Math.cos(latitude + latOrigin);
    const mc =
      ((15 / 8) * airyN ** 2 + (15 / 8) * airyN ** 3) *
      Math.sin(2 * (latitude - latOrigin)) *
      Math.cos(2 * (latitude + latOrigin));
    const md =
      (35 / 24) *
      airyN ** 3 *
      Math.sin(3 * (latitude - latOrigin)) *
      Math.cos(3 * (latitude + latOrigin));
    meridionalArc = airyB * scaleFactor * (ma - mb + mc - md);
  } while (northing - northingOrigin - meridionalArc >= 0.00001);

  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const tanLatitude = Math.tan(latitude);
  const nu = airyA * scaleFactor / Math.sqrt(1 - airyE2 * sinLatitude ** 2);
  const rho =
    (airyA * scaleFactor * (1 - airyE2)) /
    Math.pow(1 - airyE2 * sinLatitude ** 2, 1.5);
  const etaSquared = nu / rho - 1;
  const deltaEasting = easting - eastingOrigin;

  const vii = tanLatitude / (2 * rho * nu);
  const viii =
    (tanLatitude / (24 * rho * nu ** 3)) *
    (5 + 3 * tanLatitude ** 2 + etaSquared - 9 * tanLatitude ** 2 * etaSquared);
  const ix =
    (tanLatitude / (720 * rho * nu ** 5)) *
    (61 + 90 * tanLatitude ** 2 + 45 * tanLatitude ** 4);
  const x = 1 / (cosLatitude * nu);
  const xi =
    (1 / (cosLatitude * 6 * nu ** 3)) * (nu / rho + 2 * tanLatitude ** 2);
  const xii =
    (1 / (cosLatitude * 120 * nu ** 5)) *
    (5 + 28 * tanLatitude ** 2 + 24 * tanLatitude ** 4);
  const xiia =
    (1 / (cosLatitude * 5040 * nu ** 7)) *
    (61 + 662 * tanLatitude ** 2 + 1320 * tanLatitude ** 4 + 720 * tanLatitude ** 6);

  const airyLatitude =
    latitude -
    vii * deltaEasting ** 2 +
    viii * deltaEasting ** 4 -
    ix * deltaEasting ** 6;
  const airyLongitude =
    lonOrigin +
    x * deltaEasting -
    xi * deltaEasting ** 3 +
    xii * deltaEasting ** 5 -
    xiia * deltaEasting ** 7;

  const airyNu = airyA / Math.sqrt(1 - airyE2 * Math.sin(airyLatitude) ** 2);
  const x1 = airyNu * Math.cos(airyLatitude) * Math.cos(airyLongitude);
  const y1 = airyNu * Math.cos(airyLatitude) * Math.sin(airyLongitude);
  const z1 = airyNu * (1 - airyE2) * Math.sin(airyLatitude);

  const tx = 446.448;
  const ty = -125.157;
  const tz = 542.06;
  const rx = ((0.1502 / 3600) * Math.PI) / 180;
  const ry = ((0.247 / 3600) * Math.PI) / 180;
  const rz = ((0.8421 / 3600) * Math.PI) / 180;
  const scale = 20.4894 * 1e-6;

  const x2 = tx + (1 + scale) * x1 - rz * y1 + ry * z1;
  const y2 = ty + rz * x1 + (1 + scale) * y1 - rx * z1;
  const z2 = tz - ry * x1 + rx * y1 + (1 + scale) * z1;

  const wgs84A = 6378137;
  const wgs84B = 6356752.3141;
  const wgs84E2 = 1 - (wgs84B * wgs84B) / (wgs84A * wgs84A);
  const p = Math.sqrt(x2 * x2 + y2 * y2);

  let wgs84Latitude = Math.atan2(z2, p * (1 - wgs84E2));
  let nextLatitude = 0;

  do {
    wgs84Latitude = nextLatitude || wgs84Latitude;
    const nuWgs84 = wgs84A / Math.sqrt(1 - wgs84E2 * Math.sin(wgs84Latitude) ** 2);
    nextLatitude = Math.atan2(
      z2 + wgs84E2 * nuWgs84 * Math.sin(wgs84Latitude),
      p,
    );
  } while (Math.abs(nextLatitude - wgs84Latitude) > 1e-12);

  return {
    latitude: Number(((nextLatitude * 180) / Math.PI).toFixed(5)),
    longitude: Number(((Math.atan2(y2, x2) * 180) / Math.PI).toFixed(5)),
  };
}

export const checkpoints: Checkpoint[] = rawSchedule.map(
  ([leg, name, legMinutes, cumulativeMinutes, plannedClockTime], index) => ({
    id: slugify(`${leg}-${name}`),
    leg,
    name,
    legMinutes,
    cumulativeMinutes,
    plannedClockTime,
    type: toCheckpointType(name, index),
    actualArrival: null,
  }),
);

export const pacerLegs: PacerLeg[] = [
  { leg: "1", pacers: ["Ollie Burrows", "James Beckingham", "Hugh Balfour"] },
  { leg: "2", pacers: ["Jon Phillips", "Nicola Glover", "Ed Simmonds"] },
  { leg: "3", pacers: ["Ben Smith", "Jon Phillips"] },
  {
    leg: "4",
    pacers: [
      "Murray Humphrey",
      "Jon Phillips?",
      "Ben Smith? (maybe meeting Black Sail Pass continuing to Honister)",
    ],
  },
  { leg: "5", pacers: ["Nicola Glover", "Mark Foster?"] },
];

export const changeoverLocations: ChangeoverLocation[] = [
  {
    name: "Threlkeld",
    w3w: "///cure.lavished.beast",
    mapsUrl: "https://maps.app.goo.gl/RNrNdG9L2JvouWf68",
    notes: "Cricket Club Car Park. £5 via app.",
    coordinates: { latitude: 54.6181, longitude: -3.0552 },
    runnerNote: "Fresh bottles, headtorch battery check, quick food swap, keep this under 10 minutes.",
  },
  {
    name: "Dunmail Raise",
    w3w: "///haircuts.superhero.lasts",
    mapsUrl: "https://maps.app.goo.gl/T4uZH4NvnQJfwbDZA",
    notes: "Park on the verge side of the road.",
    coordinates: { latitude: 54.4659, longitude: -3.0254 },
    runnerNote: "Warm layer ready if the tops are clagged in. Refill gels and check for early stomach issues.",
  },
  {
    name: "Wasdale NT CP",
    w3w: "///spoils.boggles.technical",
    mapsUrl: "https://maps.app.goo.gl/n9c7UXTjYtcCwb52A",
    notes: "NT Car Park: £8 up to 4 hours, £9.50 all day.",
    coordinates: { latitude: 54.4547, longitude: -3.2708 },
    runnerNote: "Major reset. Hot food, dry layers, feet check, and make the call on pacing for leg 4.",
  },
  {
    name: "Honister Pass",
    w3w: "///flash.meanwhile.axed",
    mapsUrl: "https://maps.app.goo.gl/7gb2ZiDS2g15MS2z5",
    notes: "Slate Mine car park. £5 all day.",
    coordinates: { latitude: 54.5175, longitude: -3.2381 },
    runnerNote: "Keep the stop tidy. Refill for the final leg and confirm whether I need caffeine before Robinson.",
  },
  {
    name: "Newlands Church",
    w3w: "///compelled.sleeps.arming",
    mapsUrl: "https://maps.app.goo.gl/YrzrWAnyGg51nBFD8",
    notes: "Small car park just past the church over the beck. Likely free.",
    coordinates: { latitude: 54.5712, longitude: -3.1937 },
    runnerNote: "Optional roadside morale stop if needed late on. Keep the final push moving.",
  },
  {
    name: "Moot Hall",
    w3w: "///sleeps.propers.slows",
    mapsUrl: "https://maps.app.goo.gl/NpKQ6p2ZsR4G8wJr5",
    notes: "Start and finish in Keswick town centre.",
    coordinates: { latitude: 54.6007, longitude: -3.1364 },
    runnerNote: "Start calm. Finish ready with warm layers, recovery drink, and somewhere dry fast.",
  },
];

const summitGridReferences: Record<string, string> = {
  Skiddaw: "NY 260 291",
  "Great Calva": "NY 291 312",
  Blencathra: "NY 323 277",
  "Clough Head": "NY 334 225",
  "Great Dodd": "NY 342 206",
  "Watson's Dodd": "NY 336 196",
  "Stybarrow Dodd": "NY 343 189",
  Raise: "NY 343 174",
  "White Side": "NY 338 167",
  "Lower Man": "NY 337 155",
  Helvellyn: "NY 342 151",
  "Nethermost Pike": "NY 344 142",
  "Dollywagon Pike": "NY 346 131",
  Fairfield: "NY 359 118",
  "Seat Sandal": "NY 344 115",
  "Steel Fell": "NY 319 111",
  "Calf Crag": "NY 302 104",
  "Sergeant Man": "NY 286 089",
  "High Raise": "NY 281 095",
  "Thurnacar Knott": "NY 279 080",
  "Harrison Stickle": "NY 282 074",
  "Pike of Stickle": "NY 274 074",
  "Rossett Pike": "NY 249 076",
  Bowfell: "NY 245 064",
  "Esk Pike": "NY 237 075",
  "Great End": "NY 227 084",
  "Ill Crag": "NY 223 073",
  "Broad Crag": "NY 219 075",
  "Scafell Pike": "NY 215 072",
  Scafell: "NY 207 065",
  Yewbarrow: "NY 173 085",
  "Red Pike": "NY 165 106",
  Steeple: "NY 157 117",
  Pillar: "NY 171 121",
  "Kirk Fell": "NY 195 105",
  "Great Gable": "NY 211 103",
  "Green Gable": "NY 215 107",
  Brandreth: "NY 215 119",
  "Grey Knotts": "NY 217 126",
  "Dale Head": "NY 223 153",
  Hindscarth: "NY 216 165",
  Robinson: "NY 202 169",
};

export const crewWeatherLocations: WeatherLocation[] = changeoverLocations
  .filter((location) => location.name !== "Newlands Church")
  .map((location) => ({
    name: location.name,
    kind: "crew" as const,
    coordinates: location.coordinates,
  }));

export const summitWeatherLocations: WeatherLocation[] = checkpoints
  .filter((checkpoint) => checkpoint.type === "summit")
  .map((checkpoint) => {
    const gridReference = summitGridReferences[checkpoint.name];

    if (!gridReference) {
      throw new Error(`Missing summit weather coordinates for ${checkpoint.name}`);
    }

    return {
      name: checkpoint.name,
      kind: "summit" as const,
      coordinates: osGridToLatLng(gridReference),
    };
  });

export const trackerUrl = "https://track.trail.live/event/eugenes-bob-graham-round";
export const raceStartIso = "2026-05-15T19:00:00+01:00";
export const raceCutoffHours = 24;