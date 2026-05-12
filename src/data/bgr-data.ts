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

export const trackerUrl = "https://track.trail.live/event/eugenes-bob-graham-round";
export const raceStartIso = "2026-05-15T19:00:00+01:00";
export const raceCutoffHours = 24;