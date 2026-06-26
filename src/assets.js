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
  journeyScenes: {
    "puppy-home": {
      fallback: "assets/illustrations/journeys/puppy-home.svg",
      characterSize: "34%",
      startX: "4%",
      endX: "68%",
      bottom: "10%",
      goalRight: "6%",
      goalBottom: "10%",
      celebrationEmoji: "✨"
    },
    "airplane-airport": {
      fallback: "assets/illustrations/journeys/airplane-airport.svg",
      characterSize: "36%",
      startX: "4%",
      endX: "68%",
      bottom: "16%",
      goalRight: "6%",
      goalBottom: "14%",
      celebrationEmoji: "✨"
    },
    "car-finish": {
      fallback: "assets/illustrations/journeys/car-finish.svg",
      characterSize: "36%",
      startX: "4%",
      endX: "66%",
      bottom: "10%",
      goalRight: "5%",
      goalBottom: "10%",
      celebrationEmoji: "✨"
    },
    "rocket-moon": {
      fallback: "assets/illustrations/journeys/rocket-moon.svg",
      characterSize: "34%",
      startX: "5%",
      endX: "66%",
      bottom: "12%",
      goalRight: "6%",
      goalBottom: "18%",
      celebrationEmoji: "✨"
    },
    "train-station": {
      fallback: "assets/illustrations/journeys/train-station.svg",
      characterSize: "36%",
      startX: "4%",
      endX: "66%",
      bottom: "8%",
      goalRight: "6%",
      goalBottom: "10%",
      celebrationEmoji: "✨"
    },
    "dinosaur-cave": {
      background: "assets/illustrations/journeys/dinosaur-cave/background.webp",
      character: "assets/illustrations/journeys/dinosaur-cave/character.webp",
      goal: "assets/illustrations/journeys/dinosaur-cave/goal.webp",
      fallback: "assets/illustrations/journeys/dinosaur-cave.svg",
      characterSize: "34%",
      startX: "4%",
      endX: "68%",
      bottom: "9%",
      goalRight: "5%",
      goalBottom: "9%",
      celebrationEmoji: "✨"
    }
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

export function getJourneyScene(journeyId) {
  return ASSETS.journeyScenes[journeyId] || ASSETS.journeyScenes["puppy-home"];
}

export function getJourneySceneAsset(scene, key) {
  if (!scene) return null;
  if (scene[key]) return scene[key];
  if (key === "character" && scene.fallback) return scene.fallback;
  return null;
}

export function getJourneyAssetList() {
  return Array.from(new Set(
    Object.values(ASSETS.journeyScenes).flatMap((scene) =>
      [scene.background, scene.character, scene.goal, scene.fallback].filter(Boolean)
    )
  ));
}

export function getActivityAsset(activityId) {
  return ASSETS.activities[activityId] || ASSETS.activities["activity-placeholder"];
}

export function getSoundAsset(soundId) {
  return ASSETS.sounds[soundId] || null;
}
