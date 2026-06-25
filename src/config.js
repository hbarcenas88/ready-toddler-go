export const APP_INFO = {
  fullName: "Ready, Toddler, Go!",
  shortName: "Toddler Go!",
  version: "1.0.2",
  themeName: "pastelAdventure"
};

export const STORAGE = {
  appStoragePrefix: "rtg:",
  key: "rtg:app:v1",
  legacyKey: "readyToddlerGo.v1",
  dataVersion: 1,
  historyLimit: 50
};

export const TIMER_LIMITS = {
  maxDurationMinutes: 60,
  customSecondsStep: 15,
  addMinuteSeconds: 60,
  tickMs: 250
};

export const COUNTDOWN_PRESETS = [
  { id: "one", seconds: 60, labelKey: "preset1" },
  { id: "two", seconds: 120, labelKey: "preset2" },
  { id: "three", seconds: 180, labelKey: "preset3" },
  { id: "five", seconds: 300, labelKey: "preset5" },
  { id: "ten", seconds: 600, labelKey: "preset10" }
];

export const COUNTDOWN_LABEL_SUGGESTIONS = [
  "turnOffTv",
  "leaveHome",
  "bathTime",
  "changeActivity",
  "eat"
];

export const TIMER_TYPES = {
  activity: "activity",
  countdown: "countdown"
};

export const TIMER_STATUS = {
  idle: "idle",
  running: "running",
  paused: "paused",
  completed: "completed"
};

export const APP_SCREENS = {
  onboarding: "onboarding",
  home: "home",
  countdown: "countdown",
  activities: "activities",
  timer: "timer",
  settings: "settings",
  profile: "profile",
  howTo: "howTo",
  history: "history"
};

export const AGE_MODES = {
  mini: "mini",
  kids: "kids"
};

export const USE_MODES = {
  adultControls: "adultControls",
  childCanTouch: "childCanTouch"
};

export const COUNTDOWN_VISUALS = {
  journey: "journey",
  trafficLight: "trafficLight",
  circle: "circle"
};

export const SOUND = {
  ids: {
    start: "start",
    completeSoft: "completeSoft",
    completeNoticeable: "completeNoticeable",
    tap: "tap"
  },
  intensity: {
    soft: "soft",
    noticeable: "noticeable"
  }
};

export const PIN = {
  salt: "ready-toddler-go-local-pin-v1",
  minLength: 4,
  unlockHoldMs: 3000
};

export const WAKE_LOCK = {
  supportedName: "screen"
};

export const HISTORY_REASONS = {
  time: "time",
  early: "early"
};

export const THEME_REGISTRY = {
  pastelAdventure: {
    label: "Pastel adventure",
    supportsDark: false
  },
  darkPrepared: {
    label: "Dark mode placeholder",
    supportsDark: true,
    enabled: false
  }
};
