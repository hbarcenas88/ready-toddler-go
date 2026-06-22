export const ASSETS = {
  icons: {
    app: "assets/icons/icon.svg",
    maskable: "assets/icons/icon-maskable.svg"
  },
  journeys: {
    "puppy-home": "assets/illustrations/journeys/puppy-home.svg",
    "airplane-airport": "assets/illustrations/journeys/airplane-airport.svg",
    "car-finish": "assets/illustrations/journeys/car-finish.svg",
    "rocket-moon": "assets/illustrations/journeys/rocket-moon.svg",
    "train-station": "assets/illustrations/journeys/train-station.svg",
    "dinosaur-cave": "assets/illustrations/journeys/dinosaur-cave.svg"
  },
  activities: {
    "activity-placeholder": "assets/illustrations/activities/activity-placeholder.svg"
  },
  sounds: {
    start: null,
    completeSoft: null,
    completeNoticeable: null,
    tap: null
  }
};

export function getJourneyAsset(journeyId) {
  return ASSETS.journeys[journeyId] || ASSETS.journeys["puppy-home"];
}

export function getActivityAsset(activityId) {
  return ASSETS.activities[activityId] || ASSETS.activities["activity-placeholder"];
}

export function getSoundAsset(soundId) {
  return ASSETS.sounds[soundId] || null;
}
