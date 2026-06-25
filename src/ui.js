import {
  AGE_MODES,
  APP_INFO,
  APP_SCREENS,
  COUNTDOWN_LABEL_SUGGESTIONS,
  COUNTDOWN_PRESETS,
  COUNTDOWN_VISUALS,
  HISTORY_REASONS,
  PIN,
  SOUND,
  TIMER_LIMITS,
  TIMER_STATUS,
  TIMER_TYPES,
  USE_MODES
} from "./config.js";
import { getActivityAsset, getJourneyAsset } from "./assets.js";
import { getActiveLanguage, setActiveLanguage, t } from "./i18n.js";
import { DEFAULT_JOURNEY_ID, JOURNEYS, ORIGINAL_ACTIVITIES } from "./seedData.js";
import {
  clearProtectedUnlocks,
  getState,
  markProtectedSectionUnlocked,
  setBottomSheetOpen,
  setData,
  setModal,
  setOnboardingStep,
  setScreen,
  setToast
} from "./state.js";
import {
  addOneMinute,
  completeTimer,
  finishAndGoHome,
  pauseTimer,
  restartTimer,
  resumeTimer,
  setScreenLocked,
  startTimer
} from "./timerEngine.js";
import {
  exportData,
  getAppStorageSummary,
  hasLegacyStorageKey,
  replaceData,
  removeLegacyStorageKey,
  resetData,
  restoreOriginalActivities,
  saveData,
  validateImport
} from "./storage.js";
import { clearAppCaches } from "./pwa.js";

let eventsBound = false;
let unlockTimer = null;

export function renderApp() {
  const root = document.getElementById("app");
  const state = getState();
  if (!root || !state.data) return;

  root.dataset.theme = state.data.settings.theme;
  root.dataset.ageMode = activeProfile(state.data).ageMode;
  bindEvents(root);

  const screen = state.screen === APP_SCREENS.onboarding && state.data.onboardingCompleted
    ? APP_SCREENS.home
    : state.screen;

  root.innerHTML = `
    ${screen === APP_SCREENS.timer ? renderTimerScreen(state) : renderAppFrame(state, screen)}
    ${state.bottomSheetOpen ? renderBottomSheet() : ""}
    ${state.modal ? renderModal(state.modal) : ""}
    ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ""}
    ${renderLockOverlay(state)}
  `;
}

function renderAppFrame(state, screen) {
  return `
    ${renderHeader(state)}
    <main>
      ${screen === APP_SCREENS.onboarding ? renderOnboarding(state) : ""}
      ${screen === APP_SCREENS.home ? renderHome(state) : ""}
      ${screen === APP_SCREENS.countdown ? renderCountdownScreen(state) : ""}
      ${screen === APP_SCREENS.activities ? renderActivitiesScreen(state) : ""}
      ${screen === APP_SCREENS.settings ? renderSettingsScreen(state) : ""}
      ${screen === APP_SCREENS.profile ? renderProfileScreen(state) : ""}
      ${screen === APP_SCREENS.howTo ? renderHowToScreen() : ""}
      ${screen === APP_SCREENS.history ? renderHistoryScreen(state) : ""}
    </main>
  `;
}

function renderHeader(state) {
  const profile = activeProfile(state.data);
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">${profile.avatar || "🌈"}</div>
        <div>
          <p class="eyebrow">${APP_INFO.shortName}</p>
          <h1 class="title">${t("appGreeting", { name: profile.name })}</h1>
        </div>
      </div>
      <div class="icon-row">
        <button class="icon-button" type="button" data-action="open-sheet" aria-label="${t("menu")}">☰</button>
        <button class="icon-button" type="button" data-action="nav" data-screen="${APP_SCREENS.settings}" aria-label="${t("settings")}">⚙</button>
      </div>
    </header>
  `;
}

function renderHome(state) {
  const data = state.data;
  const profile = activeProfile(data);
  const favorites = getFavoriteActivities(data, profile).slice(0, 4);
  return `
    <section class="home-hero">
      <article class="card countdown-card">
        <p class="eyebrow">${t("quickCountdown")}</p>
        <h2 class="section-title">${t("calmCountdown")}</h2>
        <div class="quick-countdown-grid" aria-label="${t("quickCountdown")}">
          ${COUNTDOWN_PRESETS.map((preset) => `
            <button class="chip" type="button" data-action="start-preset" data-seconds="${preset.seconds}">${t(preset.labelKey)}</button>
          `).join("")}
          <button class="chip" type="button" data-action="open-custom-countdown">${t("custom")}</button>
        </div>
        <div class="countdown-card-footer">
          <button class="secondary-button visual-mode-button" type="button" data-action="nav" data-screen="${APP_SCREENS.countdown}">${t("visualMode")}</button>
        </div>
      </article>

      <article class="card">
        <p class="eyebrow">${t("favoriteActivities")}</p>
        <h2 class="section-title">${t("activities")}</h2>
        <div class="activity-grid">${favorites.map(renderActivityCardV2).join("")}</div>
        <div class="action-row">
          <button class="secondary-button" type="button" data-action="nav" data-screen="${APP_SCREENS.activities}">${t("allActivities")}</button>
        </div>
      </article>
    </section>
  `;
}

function renderOnboarding(state) {
  const steps = [
    ["onboarding1Title", "onboarding1Body", "⏳"],
    ["onboarding2Title", "onboarding2Body", "🪥"],
    ["onboarding3Title", "onboarding3Body", "🔒"],
    ["onboarding4Title", "onboarding4Body", "⚙"]
  ];
  const step = steps[state.onboardingStep] || steps[0];
  const isLast = state.onboardingStep >= steps.length - 1;
  return `
    <section class="card grid">
      <div class="celebration" aria-hidden="true">${step[2]}</div>
      <p class="eyebrow">${state.onboardingStep + 1} / ${steps.length}</p>
      <h2 class="section-title">${t(step[0])}</h2>
      <p>${t(step[1])}</p>
      <div class="action-row">
        <button class="primary-button" type="button" data-action="${isLast ? "finish-onboarding" : "onboarding-next"}">${isLast ? t("done") : t("next")}</button>
        <button class="ghost-button" type="button" data-action="finish-onboarding">${t("skip")}</button>
      </div>
    </section>
  `;
}

function renderCountdownScreen(state) {
  const prefs = state.data.countdownPreferences;
  return `
    <section class="card grid">
      <p class="eyebrow">${t("quickCountdown")}</p>
      <h2 class="section-title">${t("visualMode")}</h2>
      ${renderCountdownOptions(prefs)}
      <div class="chip-row">
        ${COUNTDOWN_PRESETS.map((preset) => `<button class="chip" type="button" data-action="start-preset" data-seconds="${preset.seconds}">${t(preset.labelKey)}</button>`).join("")}
        <button class="chip" type="button" data-action="open-custom-countdown">${t("custom")}</button>
      </div>
    </section>
  `;
}

function renderCountdownOptions(prefs) {
  return `
    <fieldset class="form-grid">
      <label class="field">
        <span>${t("visualMode")}</span>
        <select data-change="countdown-visual">
          ${Object.values(COUNTDOWN_VISUALS).map((visual) => `<option value="${visual}" ${prefs.defaultVisual === visual ? "selected" : ""}>${t(visual === "trafficLight" ? "trafficLight" : visual)}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>${t("journey")}</span>
        <select data-change="journey">
          ${JOURNEYS.map((journey) => `<option value="${journey.id}" ${prefs.lastUsedJourney === journey.id ? "selected" : ""}>${journey.emoji} ${t(journey.nameKey)}</option>`).join("")}
        </select>
      </label>
    </fieldset>
  `;
}

function renderActivitiesScreen(state) {
  return `
    <section class="card grid">
      <div class="action-row">
        <h2 class="section-title">${t("allActivities")}</h2>
        <button class="secondary-button" type="button" data-action="open-activity-form">${t("createActivity")}</button>
      </div>
      <p class="eyebrow">${t("familyNote")}</p>
      <div class="activity-grid">${state.data.activities.map(renderActivityCardV2).join("")}</div>
    </section>
  `;
}

function renderActivityCard(activity) {
  return `
    <article class="activity-card" data-color="${activity.color}">
      <button class="ghost-button" type="button" data-action="start-activity" data-id="${activity.id}" aria-label="${activityLabel(activity)}">
        <span class="emoji" aria-hidden="true">${activity.emoji}</span>
        <strong>${activityLabel(activity)}</strong>
        <span>${formatTime(activity.durationSeconds)}</span>
      </button>
      <div class="action-row">
        <button class="ghost-button" type="button" data-action="toggle-favorite" data-id="${activity.id}" aria-label="${t("favorite")}">${activity.favorite ? "★" : "☆"}</button>
        <button class="ghost-button" type="button" data-action="open-activity-form" data-id="${activity.id}">${t("edit")}</button>
      </div>
    </article>
  `;
}

function renderActivityCardV2(activity) {
  return `
    <article class="activity-card" data-color="${activity.color}">
      <button class="activity-main-button" type="button" data-action="start-activity" data-id="${activity.id}" aria-label="${activityLabel(activity)}">
        <span class="activity-emoji" aria-hidden="true">${activity.emoji}</span>
        <span class="activity-title">${activityLabel(activity)}</span>
        <span class="duration-badge">${formatDurationBadge(activity.durationSeconds)}</span>
      </button>
      <div class="activity-actions">
        <button class="favorite-button ${activity.favorite ? "is-favorite" : ""}" type="button" data-action="toggle-favorite" data-id="${activity.id}" aria-label="${t("favorite")}">
          <span aria-hidden="true">${activity.favorite ? "&#9829;" : "&#9825;"}</span>
        </button>
        <button class="edit-chip" type="button" data-action="open-activity-form" data-id="${activity.id}">
          <span aria-hidden="true">&#9998;</span>
          <span>${t("edit")}</span>
        </button>
      </div>
    </article>
  `;
}

function renderTimerScreen(state) {
  const timer = state.data.activeTimer;
  if (!timer) return renderAppFrame(state, APP_SCREENS.home);
  const activity = timer.activityId ? state.data.activities.find((item) => item.id === timer.activityId) : null;
  const runtime = state.timerRuntime;
  const emoji = activity?.emoji || JOURNEYS.find((journey) => journey.id === timer.journeyId)?.emoji || "⏳";
  const isCountdown = timer.type === TIMER_TYPES.countdown;
  const title = timer.name || timer.label || t("quickCountdown");
  const isCompleted = timer.status === TIMER_STATUS.completed;

  return `
    <main class="timer-screen">
      <section class="card grid">
        <p class="eyebrow">${isCountdown ? t("quickCountdown") : t("activities")}</p>
        <h1 class="section-title">${escapeHtml(title)}</h1>
        ${isCompleted ? `<div class="celebration" aria-hidden="true">⭐ ✨ ⭐</div>` : renderTimerVisual(timer, activity, runtime, emoji)}
        ${state.data.settings.showCountdownNumbers || !isCountdown ? `<div class="time-display">${formatTime(runtime.remainingSeconds)}</div>` : ""}
        <p>${isCountdown ? (runtime.remainingSeconds <= 60 ? t("almostDone") : t("calmCountdown")) : t(activity?.phraseKey || "calmCountdown")}</p>
        ${isCompleted ? renderTimerDone(timer, activity) : renderTimerControls(timer)}
      </section>
    </main>
  `;
}

function renderTimerVisual(timer, activity, runtime, emoji) {
  const progress = runtime.progress.toFixed(4);
  if (timer.type === TIMER_TYPES.countdown && timer.visual === COUNTDOWN_VISUALS.journey) {
    return `
      <div class="journey-stage" style="--progress:${progress}">
        <img src="${getJourneyAsset(timer.journeyId || DEFAULT_JOURNEY_ID)}" alt="">
        <div class="finish-flag" aria-hidden="true">🏁</div>
      </div>
    `;
  }
  if (timer.type === TIMER_TYPES.countdown && timer.visual === COUNTDOWN_VISUALS.trafficLight) {
    const stage = runtime.progress > 0.72 ? "red" : runtime.progress > 0.42 ? "yellow" : "green";
    return `
      <div class="traffic-light" aria-hidden="true">
        <span class="green ${stage === "green" ? "is-on" : ""}"></span>
        <span class="yellow ${stage === "yellow" ? "is-on" : ""}"></span>
        <span class="red ${stage === "red" ? "is-on" : ""}"></span>
      </div>
    `;
  }
  return `
    <div class="progress-wrap">
      <div class="progress-ring" style="--progress:${progress}"><div class="progress-ring-inner">${activity ? activity.emoji : emoji}</div></div>
      ${activity ? `<img src="${getActivityAsset(activity.assetId)}" alt="" width="180" height="130">` : ""}
    </div>
  `;
}

function renderTimerControls(timer) {
  const isPaused = timer.status === TIMER_STATUS.paused;
  return `
    <div class="action-row">
      <button class="secondary-button" type="button" data-action="${isPaused ? "resume-timer" : "pause-timer"}">${isPaused ? t("resume") : t("pause")}</button>
      <button class="secondary-button" type="button" data-action="add-minute">${t("addMinute")}</button>
      <button class="secondary-button" type="button" data-action="restart-timer">${t("restart")}</button>
      <button class="primary-button" type="button" data-action="${timer.type === TIMER_TYPES.activity ? "complete-timer" : "finish-countdown"}">${timer.type === TIMER_TYPES.activity ? t("completeActivity") : t("finishNow")}</button>
      <button class="ghost-button" type="button" data-action="lock-timer">${t("lockScreen")}</button>
      <button class="ghost-button" type="button" data-action="timer-home">${t("backHome")}</button>
    </div>
  `;
}

function renderTimerDone(timer, activity) {
  const message = timer.type === TIMER_TYPES.activity ? t(activity?.finalKey || "timerDone") : t("timerDone");
  return `<div class="grid"><h2 class="section-title">${message}</h2><button class="primary-button" type="button" data-action="timer-home">${t("backHome")}</button></div>`;
}

function renderSettingsScreen(state) {
  const data = state.data;
  return `
    <section class="settings-list">
      <article class="card settings-section">
        <h2 class="section-title">${t("adultSettings")}</h2>
        <label class="field"><span>${t("language")}</span><select data-change="language"><option value="es" ${data.settings.language === "es" ? "selected" : ""}>${t("spanish")}</option><option value="en" ${data.settings.language === "en" ? "selected" : ""}>${t("english")}</option></select></label>
        <label class="field"><span>${t("usageMode")}</span><select data-change="use-mode"><option value="${USE_MODES.adultControls}" ${data.settings.useMode === USE_MODES.adultControls ? "selected" : ""}>${t("adultControls")}</option><option value="${USE_MODES.childCanTouch}" ${data.settings.useMode === USE_MODES.childCanTouch ? "selected" : ""}>${t("childCanTouch")}</option></select></label>
        <p class="eyebrow">${t("childModeNote")}</p>
        <button class="secondary-button" type="button" data-action="open-pin-setup">${data.settings.pinHash ? t("changePin") : t("setupPin")}</button>
      </article>
      <article class="card settings-section">
        <h2 class="section-title">${t("soundAndVibration")}</h2>
        ${renderToggle("soundEnabled", t("soundEnabled"), data.settings.soundEnabled)}
        <label class="field"><span>${t("soundIntensity")}</span><select data-change="setting" data-key="soundIntensity"><option value="${SOUND.intensity.soft}" ${data.settings.soundIntensity === SOUND.intensity.soft ? "selected" : ""}>${t("soft")}</option><option value="${SOUND.intensity.noticeable}" ${data.settings.soundIntensity === SOUND.intensity.noticeable ? "selected" : ""}>${t("noticeable")}</option></select></label>
        ${renderToggle("intermediateSoundsEnabled", t("intermediateSounds"), data.settings.intermediateSoundsEnabled)}
        ${renderToggle("vibrationEnabled", t("vibration"), data.settings.vibrationEnabled)}
        ${renderToggle("keepScreenAwake", t("keepAwake"), data.settings.keepScreenAwake)}
      </article>
      <article class="card settings-section">
        <h2 class="section-title">${t("activities")}</h2>
        ${renderProtectedGate("activities")}
        ${canUseSection("activities") ? `<div class="action-row"><button class="secondary-button" type="button" data-action="open-activity-form">${t("createActivity")}</button><button class="secondary-button" type="button" data-action="restore-activities">${t("restoreAllDefaults")}</button></div>` : ""}
      </article>
      <article class="card settings-section">
        <h2 class="section-title">${t("dataManagement")}</h2>
        ${renderProtectedGate("data")}
        ${canUseSection("data") ? renderDataManagement(state) : ""}
      </article>
      <article class="card settings-section">
        <h2 class="section-title">${t("aboutTitle")}</h2>
        <p>${t("aboutBody")}</p>
        <p><strong>${t("familyNote")}</strong></p>
        <p class="eyebrow">${t("noMedicalAdvice")}</p>
      </article>
    </section>
  `;
}

function renderProtectedGate(section) {
  const data = getState().data;
  if (data.settings.useMode !== USE_MODES.childCanTouch || canUseSection(section)) return "";
  return `<button class="secondary-button" type="button" data-action="unlock-section" data-section="${section}">${t("unlock")}</button>`;
}

function renderDataManagement(state) {
  const data = state.data;
  return `
    <div class="action-row">
      <button class="secondary-button" type="button" data-action="export-data">${t("exportData")}</button>
      <button class="secondary-button" type="button" data-action="trigger-import">${t("importData")}</button>
      <button class="secondary-button" type="button" data-action="repair-app">${t("repairApp")}</button>
      <button class="danger-button" type="button" data-action="reset-app">${t("resetApp")}</button>
      <input id="importFile" type="file" accept="application/json,.json" hidden>
    </div>
    <p class="eyebrow">${t("storageScopeNote")}</p>
    <div class="soft-card">
      <p><strong>${t("appVersion")}:</strong> ${APP_INFO.version}</p>
      <p><strong>${t("dataVersion")}:</strong> ${data.dataVersion}</p>
      <p><strong>${t("activityCount")}:</strong> ${data.activities.length}</p>
      <p><strong>${t("profileCount")}:</strong> ${data.profiles.length}</p>
      <p><strong>${t("historyCount")}:</strong> ${data.history.length}</p>
      <p><strong>${t("appStorageKeys")}:</strong> ${getAppStorageSummary().map((item) => `${item.key} (${item.bytes} bytes)`).join(", ")}</p>
    </div>
    ${hasLegacyStorageKey() ? `
      <div class="soft-card">
        <p>${t("oldStorageFound")}</p>
        <button class="danger-button" type="button" data-action="remove-old-storage-key">${t("removeOldStorageKey")}</button>
      </div>
    ` : ""}
  `;
}

function renderToggle(key, label, checked) {
  return `<label class="field"><span>${label}</span><select data-change="setting" data-key="${key}"><option value="true" ${checked ? "selected" : ""}>${t("done")}</option><option value="false" ${!checked ? "selected" : ""}>${t("no")}</option></select></label>`;
}

function renderProfileScreen(state) {
  const profile = activeProfile(state.data);
  return `
    <section class="card grid">
      <h2 class="section-title">${t("childProfile")}</h2>
      <form class="form-grid" data-submit="profile">
        <label class="field"><span>${t("activityName")}</span><input name="name" value="${escapeAttr(profile.name)}" placeholder="${t("namePlaceholder")}"></label>
        <label class="field"><span>${t("avatar")}</span><input name="avatar" value="${escapeAttr(profile.avatar || "🌈")}" maxlength="4"></label>
        <label class="field"><span>${t("ageMode")}</span><select name="ageMode"><option value="${AGE_MODES.mini}" ${profile.ageMode === AGE_MODES.mini ? "selected" : ""}>${t("mini")}</option><option value="${AGE_MODES.kids}" ${profile.ageMode === AGE_MODES.kids ? "selected" : ""}>${t("kids")}</option></select></label>
        <button class="primary-button" type="submit">${t("save")}</button>
      </form>
    </section>
  `;
}

function renderHowToScreen() {
  return `<section class="card grid"><h2 class="section-title">${t("howToUse")}</h2>${["tutorialCountdown","tutorialActivity","tutorialLock","tutorialEdit","tutorialMode","tutorialExport","tutorialRepair"].map((key) => `<p>${t(key)}</p>`).join("")}</section>`;
}

function renderHistoryScreen(state) {
  const history = state.data.history;
  return `
    <section class="card grid">
      <h2 class="section-title">${t("simpleHistory")}</h2>
      ${history.length ? history.map((item) => `<article class="history-item"><strong>${escapeHtml(item.name || "")}</strong><span>${new Date(item.completedAt).toLocaleString()}</span><span>${formatTime(item.plannedDurationSeconds)} · ${t(item.completedReason === HISTORY_REASONS.time ? "completedByTime" : "completedEarly")}</span></article>`).join("") : `<p>${t("noHistory")}</p>`}
    </section>
  `;
}

function renderBottomSheet() {
  const items = [
    [APP_SCREENS.home, "home", "🏠"],
    [APP_SCREENS.countdown, "quickCountdown", "⏳"],
    [APP_SCREENS.activities, "activities", "🧸"],
    [APP_SCREENS.profile, "childProfile", "🌈"],
    [APP_SCREENS.howTo, "howToUse", "💡"],
    [APP_SCREENS.settings, "adultSettings", "⚙"],
    [APP_SCREENS.history, "simpleHistory", "⭐"]
  ];
  return `<div class="sheet-backdrop" data-action="close-sheet"></div><nav class="bottom-sheet" aria-label="${t("menu")}"><div class="action-row"><h2 class="section-title">${t("menu")}</h2><button class="ghost-button" type="button" data-action="close-sheet">${t("close")}</button></div><div class="grid">${items.map(([screen, key, icon]) => `<button class="secondary-button" type="button" data-action="nav" data-screen="${screen}">${icon} ${t(key)}</button>`).join("")}</div></nav>`;
}

function renderModal(modal) {
  return `<div class="modal-backdrop" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true">${modal.type === "customCountdown" ? renderCustomCountdownModal() : ""}${modal.type === "activityForm" ? renderActivityFormModal(modal.activityId) : ""}${modal.type === "pinSetup" ? renderPinSetupModal(modal.pendingMode) : ""}${modal.type === "pinCheck" ? renderPinCheckModal(modal.section) : ""}</section>`;
}

function renderCustomCountdownModal() {
  const minuteOptions = Array.from({ length: TIMER_LIMITS.maxDurationMinutes + 1 }, (_, index) => index);
  const secondOptions = [0, 15, 30, 45];
  const prefs = getState().data.countdownPreferences;
  return `
    <form class="form-grid" data-submit="custom-countdown">
      <h2 class="section-title">${t("custom")} ${t("quickCountdown").toLowerCase()}</h2>
      <label class="field"><span>${t("minutes")}</span><select name="minutes">${minuteOptions.map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>
      <label class="field"><span>${t("seconds")}</span><select name="seconds">${secondOptions.map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>
      <label class="field"><span>${t("countdownLabel")}</span><input name="label" placeholder="${t("countdownLabelPlaceholder")}" value="${escapeAttr(prefs.lastLabel || "")}"></label>
      <div class="chip-row">${COUNTDOWN_LABEL_SUGGESTIONS.map((key) => `<button class="chip" type="button" data-action="label-suggestion" data-value="${t(key)}">${t(key)}</button>`).join("")}</div>
      ${renderCountdownOptions(prefs)}
      <div class="action-row"><button class="primary-button" type="submit">${t("start")}</button><button class="ghost-button" type="button" data-action="close-modal">${t("cancel")}</button></div>
    </form>
  `;
}

function renderActivityFormModal(activityId) {
  const data = getState().data;
  const activity = activityId
    ? data.activities.find((item) => item.id === activityId)
    : { id: "", name: { es: "", en: "" }, durationSeconds: 120, emoji: "⭐", favorite: false, color: "mint", phraseKey: "calmCountdown", finalKey: "timerDone", soundPreference: "default", assetId: "activity-placeholder", type: "custom", isDefault: false };
  return `
    <form class="form-grid" data-submit="activity" data-id="${activity.id}">
      <h2 class="section-title">${activity.id ? t("editActivity") : t("createActivity")}</h2>
      <label class="field"><span>${t("activityName")} ES</span><input name="nameEs" required value="${escapeAttr(activity.name.es || "")}"></label>
      <label class="field"><span>${t("activityName")} EN</span><input name="nameEn" required value="${escapeAttr(activity.name.en || "")}"></label>
      <label class="field"><span>${t("duration")}</span><input name="durationMinutes" type="number" min="0.25" max="${TIMER_LIMITS.maxDurationMinutes}" step="0.25" value="${activity.durationSeconds / 60}"></label>
      <label class="field"><span>${t("activityIcon")}</span><input name="emoji" maxlength="4" value="${escapeAttr(activity.emoji || "⭐")}"></label>
      <label class="field"><span>${t("favorite")}</span><select name="favorite"><option value="true" ${activity.favorite ? "selected" : ""}>${t("done")}</option><option value="false" ${!activity.favorite ? "selected" : ""}>${t("no")}</option></select></label>
      <div class="action-row">
        <button class="primary-button" type="submit">${t("save")}</button>
        ${activity.isDefault ? `<button class="secondary-button" type="button" data-action="restore-one-activity" data-id="${activity.id}">${t("restoreDefault")}</button>` : ""}
        ${activity.id && !activity.isDefault ? `<button class="danger-button" type="button" data-action="delete-activity" data-id="${activity.id}">${t("delete")}</button>` : ""}
        <button class="ghost-button" type="button" data-action="close-modal">${t("cancel")}</button>
      </div>
    </form>
  `;
}

function renderPinSetupModal(pendingMode) {
  return `<form class="form-grid" data-submit="pin-setup" data-pending-mode="${pendingMode || ""}"><h2 class="section-title">${t("setupPin")}</h2><label class="field"><span>${t("pin")}</span><input name="pin" type="password" inputmode="numeric" autocomplete="new-password" minlength="${PIN.minLength}" required></label><div class="action-row"><button class="primary-button" type="submit">${t("save")}</button><button class="ghost-button" type="button" data-action="close-modal">${t("cancel")}</button></div></form>`;
}

function renderPinCheckModal(section) {
  return `<form class="form-grid" data-submit="pin-check" data-section="${section}"><h2 class="section-title">${t("protectedArea")}</h2><label class="field"><span>${t("enterPin")}</span><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label><div class="action-row"><button class="primary-button" type="submit">${t("unlock")}</button><button class="ghost-button" type="button" data-action="close-modal">${t("cancel")}</button></div></form>`;
}

function renderLockOverlay(state) {
  const timer = state.data.activeTimer;
  if (!timer?.screenLocked || timer.status === TIMER_STATUS.completed) return "";
  return `<div class="lock-overlay"><div class="lock-panel"><div class="celebration" aria-hidden="true">🔒</div><h2 class="section-title">${t("locked")}</h2><p>${t("holdToUnlock")}</p><button class="primary-button" type="button" data-action="hold-unlock">${t("unlock")}</button></div></div>`;
}

function bindEvents(root) {
  if (eventsBound) return;
  eventsBound = true;
  root.addEventListener("click", handleClick);
  root.addEventListener("change", handleChange);
  root.addEventListener("submit", handleSubmit);
  root.addEventListener("pointerdown", handlePressStart);
  root.addEventListener("pointerup", handlePressEnd);
  root.addEventListener("pointercancel", handlePressEnd);
  root.addEventListener("pointerleave", handlePressEnd);
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const state = getState();
  const data = state.data;

  if (["open-activity-form", "restore-activities", "export-data", "trigger-import", "reset-app", "remove-old-storage-key"].includes(action) && actionNeedsProtection(action)) return;
  if (action === "nav") setScreen(button.dataset.screen);
  if (action === "open-sheet") setBottomSheetOpen(true);
  if (action === "close-sheet") setBottomSheetOpen(false);
  if (action === "close-modal") setModal(null);
  if (action === "onboarding-next") setOnboardingStep(state.onboardingStep + 1);
  if (action === "finish-onboarding") {
    data.onboardingCompleted = true;
    saveData(data);
    setData(data);
    setScreen(APP_SCREENS.home);
  }
  if (action === "start-preset") startCountdown(Number(button.dataset.seconds));
  if (action === "open-custom-countdown") setModal({ type: "customCountdown" });
  if (action === "label-suggestion") {
    const input = document.querySelector("input[name='label']");
    if (input) input.value = button.dataset.value;
  }
  if (action === "start-activity") startActivity(button.dataset.id);
  if (action === "toggle-favorite") toggleFavorite(button.dataset.id);
  if (action === "open-activity-form") setModal({ type: "activityForm", activityId: button.dataset.id || null });
  if (action === "restore-one-activity") restoreOneActivity(button.dataset.id);
  if (action === "delete-activity") deleteActivity(button.dataset.id);
  if (action === "restore-activities" && window.confirm(t("resetConfirm"))) {
    restoreOriginalActivities(data);
    saveData(data);
    setData(data);
  }
  if (action === "pause-timer") pauseTimer();
  if (action === "resume-timer") resumeTimer();
  if (action === "restart-timer") restartTimer();
  if (action === "add-minute") addOneMinute();
  if (action === "complete-timer") completeTimer(HISTORY_REASONS.early);
  if (action === "finish-countdown") completeTimer(HISTORY_REASONS.early);
  if (action === "timer-home") finishAndGoHome();
  if (action === "lock-timer") setScreenLocked(true);
  if (action === "unlock-section") setModal({ type: "pinCheck", section: button.dataset.section });
  if (action === "open-pin-setup") setModal({ type: "pinSetup" });
  if (action === "export-data") exportCurrentData();
  if (action === "trigger-import") document.getElementById("importFile")?.click();
  if (action === "repair-app") repairApp();
  if (action === "remove-old-storage-key" && window.confirm(t("removeOldStorageConfirm"))) {
    removeLegacyStorageKey();
    setToast(t("removeOldStorageOk"));
    setData(data);
  }
  if (action === "reset-app" && window.confirm(t("resetConfirm"))) {
    clearProtectedUnlocks();
    setData(resetData());
    setActiveLanguage(getState().data.settings.language);
    setScreen(APP_SCREENS.onboarding);
  }
}

function actionNeedsProtection(action) {
  const section = ["open-activity-form", "restore-activities"].includes(action) ? "activities" : "data";
  if (canUseSection(section)) return false;
  setModal({ type: "pinCheck", section });
  return true;
}

function handleChange(event) {
  const target = event.target;
  const data = getState().data;
  if (target.id === "importFile") {
    importFromFile(target.files?.[0]);
    target.value = "";
    return;
  }
  if (!target.dataset.change) return;

  if (target.dataset.change === "language") {
    data.settings.language = target.value;
    activeProfile(data).preferredLanguage = target.value;
    setActiveLanguage(target.value);
  }
  if (target.dataset.change === "setting") {
    data.settings[target.dataset.key] = target.value === "true" ? true : target.value === "false" ? false : target.value;
  }
  if (target.dataset.change === "use-mode") {
    if (target.value === USE_MODES.childCanTouch && !data.settings.pinHash) {
      target.value = USE_MODES.adultControls;
      setModal({ type: "pinSetup", pendingMode: USE_MODES.childCanTouch });
      return;
    }
    data.settings.useMode = target.value;
    clearProtectedUnlocks();
  }
  if (target.dataset.change === "countdown-visual") data.countdownPreferences.defaultVisual = target.value;
  if (target.dataset.change === "journey") data.countdownPreferences.lastUsedJourney = target.value;
  saveData(data);
  setData(data);
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.submit === "custom-countdown") submitCustomCountdown(form);
  if (form.dataset.submit === "activity") submitActivity(form);
  if (form.dataset.submit === "profile") submitProfile(form);
  if (form.dataset.submit === "pin-setup") submitPinSetup(form);
  if (form.dataset.submit === "pin-check") submitPinCheck(form);
}

function handlePressStart(event) {
  if (!event.target.closest("[data-action='hold-unlock']")) return;
  handlePressEnd();
  unlockTimer = window.setTimeout(() => {
    setScreenLocked(false);
    unlockTimer = null;
  }, PIN.unlockHoldMs);
}

function handlePressEnd() {
  if (unlockTimer) window.clearTimeout(unlockTimer);
  unlockTimer = null;
}

function startCountdown(seconds, label = "") {
  const data = getState().data;
  startTimer({
    type: TIMER_TYPES.countdown,
    name: label || t("quickCountdown"),
    label,
    durationSeconds: seconds,
    journeyId: data.countdownPreferences.lastUsedJourney || DEFAULT_JOURNEY_ID,
    visual: data.countdownPreferences.defaultVisual || COUNTDOWN_VISUALS.journey
  });
}

function submitCustomCountdown(form) {
  const values = new FormData(form);
  const total = Number(values.get("minutes")) * 60 + Number(values.get("seconds"));
  if (total <= 0) {
    setToast(t("durationRequired"));
    return;
  }
  const data = getState().data;
  data.countdownPreferences.lastLabel = String(values.get("label") || "");
  saveData(data);
  setModal(null);
  startCountdown(total, data.countdownPreferences.lastLabel);
}

function startActivity(id) {
  const data = getState().data;
  const activity = data.activities.find((item) => item.id === id);
  if (!activity) return;
  startTimer({ type: TIMER_TYPES.activity, activityId: activity.id, name: activityLabel(activity), durationSeconds: activity.durationSeconds });
}

function toggleFavorite(id) {
  const data = getState().data;
  const activity = data.activities.find((item) => item.id === id);
  if (!activity) return;
  activity.favorite = !activity.favorite;
  syncProfileFavorites(data);
  saveData(data);
  setData(data);
}

function submitActivity(form) {
  const data = getState().data;
  const values = new FormData(form);
  const id = form.dataset.id || `custom-${Date.now()}`;
  const existing = data.activities.find((item) => item.id === id);
  const next = {
    ...(existing || {}),
    id,
    name: { es: String(values.get("nameEs")), en: String(values.get("nameEn")) },
    durationSeconds: Math.max(1, Math.round(Number(values.get("durationMinutes")) * 60)),
    emoji: String(values.get("emoji") || "⭐"),
    favorite: values.get("favorite") === "true",
    color: existing?.color || "mint",
    phraseKey: existing?.phraseKey || "calmCountdown",
    finalKey: existing?.finalKey || "timerDone",
    soundPreference: existing?.soundPreference || "default",
    assetId: existing?.assetId || "activity-placeholder",
    type: existing?.type || "custom",
    isDefault: existing?.isDefault || false
  };
  data.activities = existing ? data.activities.map((item) => item.id === id ? next : item) : [next, ...data.activities];
  syncProfileFavorites(data);
  saveData(data);
  setData(data);
  setModal(null);
}

function submitProfile(form) {
  const data = getState().data;
  const values = new FormData(form);
  const profile = activeProfile(data);
  profile.name = String(values.get("name") || "Peque");
  profile.avatar = String(values.get("avatar") || "🌈");
  profile.ageMode = String(values.get("ageMode"));
  saveData(data);
  setData(data);
  setScreen(APP_SCREENS.home);
}

async function submitPinSetup(form) {
  const data = getState().data;
  const pin = String(new FormData(form).get("pin") || "");
  if (pin.length < PIN.minLength) {
    setToast(t("pinTooShort"));
    return;
  }
  data.settings.pinHash = await hashPin(pin);
  if (form.dataset.pendingMode) data.settings.useMode = form.dataset.pendingMode;
  saveData(data);
  setData(data);
  setModal(null);
}

async function submitPinCheck(form) {
  const data = getState().data;
  const pin = String(new FormData(form).get("pin") || "");
  if ((await hashPin(pin)) !== data.settings.pinHash) {
    setToast(t("pinIncorrect"));
    return;
  }
  markProtectedSectionUnlocked(form.dataset.section);
  setModal(null);
}

function restoreOneActivity(id) {
  const data = getState().data;
  const original = ORIGINAL_ACTIVITIES.find((activity) => activity.id === id);
  if (!original) return;
  data.activities = data.activities.map((activity) => activity.id === id ? { ...original, name: { ...original.name } } : activity);
  syncProfileFavorites(data);
  saveData(data);
  setData(data);
  setModal(null);
}

function deleteActivity(id) {
  const data = getState().data;
  const activity = data.activities.find((item) => item.id === id);
  if (!activity || activity.isDefault) return;
  data.activities = data.activities.filter((item) => item.id !== id);
  syncProfileFavorites(data);
  saveData(data);
  setData(data);
  setModal(null);
}

function exportCurrentData() {
  const payload = exportData(getState().data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `toddler-go-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setToast(t("exportOk"));
}

async function importFromFile(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!validateImport(parsed)) throw new Error("invalid");
    if (!window.confirm(t("importConfirm"))) return;
    const data = replaceData({ ...parsed, activeTimer: null });
    setActiveLanguage(data.settings.language);
    setData(data);
    setToast(t("importOk"));
  } catch {
    setToast(t("importError"));
  }
}

async function repairApp() {
  await clearAppCaches();
  setToast(t("repairOk"));
}

function canUseSection(section) {
  const state = getState();
  return state.data.settings.useMode !== USE_MODES.childCanTouch || state.unlockedProtectedSections.has(section);
}

function syncProfileFavorites(data) {
  const favoriteIds = data.activities.filter((activity) => activity.favorite).map((activity) => activity.id);
  data.profiles = data.profiles.map((profile) => ({ ...profile, favoriteActivities: favoriteIds }));
}

function activeProfile(data) {
  return data.profiles.find((profile) => profile.id === data.activeProfileId) || data.profiles[0];
}

function getFavoriteActivities(data, profile) {
  const ids = new Set(profile.favoriteActivities || data.activities.filter((activity) => activity.favorite).map((activity) => activity.id));
  const favorites = data.activities.filter((activity) => ids.has(activity.id) || activity.favorite);
  return favorites.length ? favorites : data.activities.slice(0, 4);
}

function activityLabel(activity) {
  const language = getActiveLanguage();
  return activity?.name?.[language] || activity?.name?.en || activity?.name?.es || "";
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatDurationBadge(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60} min`;
  }
  return formatTime(seconds);
}

async function hashPin(pin) {
  const value = `${PIN.salt}:${pin}`;
  if (crypto.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return `fallback-${hash}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
