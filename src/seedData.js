import { AGE_MODES, COUNTDOWN_VISUALS, SOUND, USE_MODES } from "./config.js";

export const JOURNEYS = [
  { id: "puppy-home", nameKey: "journeyPuppy", assetId: "puppy-home", emoji: "🐶" },
  { id: "airplane-airport", nameKey: "journeyAirplane", assetId: "airplane-airport", emoji: "✈️" },
  { id: "car-finish", nameKey: "journeyCar", assetId: "car-finish", emoji: "🚗" },
  { id: "rocket-moon", nameKey: "journeyRocket", assetId: "rocket-moon", emoji: "🚀" },
  { id: "train-station", nameKey: "journeyTrain", assetId: "train-station", emoji: "🚂" },
  { id: "dinosaur-cave", nameKey: "journeyDinosaur", assetId: "dinosaur-cave", emoji: "🦕" }
];

export const DEFAULT_JOURNEY_ID = "puppy-home";

export const ORIGINAL_ACTIVITIES = [
  {
    id: "brush-teeth",
    name: { es: "Lavarse los dientes", en: "Brush teeth" },
    durationSeconds: 120,
    emoji: "🪥",
    favorite: true,
    color: "mint",
    phraseKey: "activityPhraseBrush",
    finalKey: "activityFinalBrush",
    soundPreference: "default",
    assetId: "activity-placeholder",
    type: "routine",
    isDefault: true
  },
  {
    id: "wash-hands",
    name: { es: "Lavarse las manos", en: "Wash hands" },
    durationSeconds: 30,
    emoji: "🫧",
    favorite: true,
    color: "blue",
    phraseKey: "activityPhraseHands",
    finalKey: "activityFinalHands",
    soundPreference: "soft",
    assetId: "activity-placeholder",
    type: "routine",
    isDefault: true
  },
  {
    id: "get-dressed",
    name: { es: "Vestirse", en: "Get dressed" },
    durationSeconds: 300,
    emoji: "👕",
    favorite: true,
    color: "sun",
    phraseKey: "activityPhraseDressed",
    finalKey: "activityFinalDressed",
    soundPreference: "default",
    assetId: "activity-placeholder",
    type: "routine",
    isDefault: true
  },
  {
    id: "clean-toys",
    name: { es: "Recoger juguetes", en: "Clean up toys" },
    durationSeconds: 300,
    emoji: "🧸",
    favorite: false,
    color: "rose",
    phraseKey: "activityPhraseToys",
    finalKey: "activityFinalToys",
    soundPreference: "default",
    assetId: "activity-placeholder",
    type: "routine",
    isDefault: true
  },
  {
    id: "eat",
    name: { es: "Comer", en: "Eat" },
    durationSeconds: 1200,
    emoji: "🍓",
    favorite: false,
    color: "peach",
    phraseKey: "activityPhraseEat",
    finalKey: "activityFinalEat",
    soundPreference: "soft",
    assetId: "activity-placeholder",
    type: "routine",
    isDefault: true
  },
  {
    id: "potty",
    name: { es: "Ir al baño", en: "Potty" },
    durationSeconds: 180,
    emoji: "🚽",
    favorite: false,
    color: "lavender",
    phraseKey: "activityPhrasePotty",
    finalKey: "activityFinalPotty",
    soundPreference: "soft",
    assetId: "activity-placeholder",
    type: "routine",
    isDefault: true
  },
  {
    id: "calm-down",
    name: { es: "Calmarse", en: "Calm down" },
    durationSeconds: 120,
    emoji: "🌙",
    favorite: false,
    color: "blue",
    phraseKey: "activityPhraseCalm",
    finalKey: "activityFinalCalm",
    soundPreference: "soft",
    assetId: "activity-placeholder",
    type: "calm",
    isDefault: true
  },
  {
    id: "leave-home",
    name: { es: "Salir de casa", en: "Leave home" },
    durationSeconds: 300,
    emoji: "🏡",
    favorite: true,
    color: "mint",
    phraseKey: "activityPhraseLeave",
    finalKey: "activityFinalLeave",
    soundPreference: "noticeable",
    assetId: "activity-placeholder",
    type: "transition",
    isDefault: true
  }
];

export const DEFAULT_PROFILE = {
  id: "profile-peque",
  name: "Peque",
  avatar: "🌈",
  ageMode: AGE_MODES.mini,
  preferredLanguage: null,
  favoriteActivities: ["brush-teeth", "wash-hands", "get-dressed", "leave-home"],
  routines: []
};

export const DEFAULT_SETTINGS = {
  language: null,
  useMode: USE_MODES.adultControls,
  soundEnabled: true,
  soundIntensity: SOUND.intensity.soft,
  intermediateSoundsEnabled: false,
  vibrationEnabled: true,
  keepScreenAwake: true,
  countdownVisual: COUNTDOWN_VISUALS.journey,
  showCountdownNumbers: true,
  theme: "pastelAdventure",
  pinHash: null
};

export const DEFAULT_COUNTDOWN_PREFERENCES = {
  lastUsedJourney: DEFAULT_JOURNEY_ID,
  defaultVisual: COUNTDOWN_VISUALS.journey,
  lastLabel: ""
};

export function createDefaultData(language) {
  return {
    dataVersion: 1,
    settings: { ...DEFAULT_SETTINGS, language },
    profiles: [{ ...DEFAULT_PROFILE, preferredLanguage: language }],
    activeProfileId: DEFAULT_PROFILE.id,
    activities: ORIGINAL_ACTIVITIES.map((activity) => ({ ...activity, name: { ...activity.name } })),
    countdownPreferences: { ...DEFAULT_COUNTDOWN_PREFERENCES },
    journeys: JOURNEYS.map((journey) => ({ ...journey })),
    history: [],
    onboardingCompleted: false,
    activeTimer: null
  };
}
