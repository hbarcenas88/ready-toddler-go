import { APP_INFO, STORAGE } from "./config.js";
import { createDefaultData, ORIGINAL_ACTIVITIES } from "./seedData.js";
import { detectLanguage } from "./i18n.js";

export function loadData() {
  const language = detectLanguage();
  const raw = localStorage.getItem(STORAGE.key);
  if (!raw) return createDefaultData(language);

  try {
    const parsed = JSON.parse(raw);
    if (parsed.dataVersion !== STORAGE.dataVersion) {
      return migrateData(parsed, language);
    }
    return normalizeData(parsed, language);
  } catch {
    return createDefaultData(language);
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE.key, JSON.stringify(data));
}

export function replaceData(data) {
  const normalized = normalizeData(data, detectLanguage());
  saveData(normalized);
  return normalized;
}

export function resetData() {
  const data = createDefaultData(detectLanguage());
  saveData(data);
  return data;
}

export function restoreOriginalActivities(data) {
  data.activities = ORIGINAL_ACTIVITIES.map((activity) => ({ ...activity, name: { ...activity.name } }));
  data.profiles = data.profiles.map((profile) => ({
    ...profile,
    favoriteActivities: ORIGINAL_ACTIVITIES.filter((activity) => activity.favorite).map((activity) => activity.id)
  }));
  return data;
}

export function exportData(data) {
  return {
    app: APP_INFO.fullName,
    dataVersion: STORAGE.dataVersion,
    exportedAt: new Date().toISOString(),
    settings: data.settings,
    profiles: data.profiles,
    activeProfileId: data.activeProfileId,
    activities: data.activities,
    countdownPreferences: data.countdownPreferences,
    history: data.history,
    onboardingCompleted: data.onboardingCompleted
  };
}

export function validateImport(candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  if (candidate.app !== APP_INFO.fullName) return false;
  if (candidate.dataVersion !== STORAGE.dataVersion) return false;
  if (!Array.isArray(candidate.profiles) || !Array.isArray(candidate.activities)) return false;
  if (!candidate.settings || typeof candidate.settings !== "object") return false;
  return true;
}

function migrateData(parsed, language) {
  return normalizeData({ ...createDefaultData(language), ...parsed, dataVersion: STORAGE.dataVersion }, language);
}

function normalizeData(data, language) {
  const defaults = createDefaultData(language);
  const next = {
    ...defaults,
    ...data,
    settings: { ...defaults.settings, ...(data.settings || {}) },
    countdownPreferences: { ...defaults.countdownPreferences, ...(data.countdownPreferences || {}) },
    profiles: Array.isArray(data.profiles) && data.profiles.length ? data.profiles : defaults.profiles,
    activities: Array.isArray(data.activities) && data.activities.length ? data.activities : defaults.activities,
    history: Array.isArray(data.history) ? data.history.slice(0, STORAGE.historyLimit) : [],
    activeTimer: data.activeTimer || null
  };
  if (!next.profiles.some((profile) => profile.id === next.activeProfileId)) {
    next.activeProfileId = next.profiles[0].id;
  }
  return next;
}
