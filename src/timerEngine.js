import { HISTORY_REASONS, STORAGE, TIMER_LIMITS, TIMER_STATUS, TIMER_TYPES } from "./config.js";
import { getState, setData, setScreen, setTimerRuntime } from "./state.js";
import { saveData } from "./storage.js";
import { vibrateCompletion, playAppSound } from "./sounds.js";
import { SOUND, APP_SCREENS } from "./config.js";
import { releaseWakeLock, requestWakeLock } from "./pwa.js";

let intervalId;
let startInProgress = false;
const timerAudioFlags = {
  timerId: null,
  almostDonePlayed: false,
  finishPlayed: false
};

export function startTimer(timerInput) {
  const state = getState();
  const existingTimer = state.data?.activeTimer;
  if (startInProgress || (existingTimer && existingTimer.status !== TIMER_STATUS.completed)) return;
  startInProgress = true;

  const now = Date.now();
  const durationSeconds = clampDuration(timerInput.durationSeconds);
  const activeTimer = {
    id: `timer-${now}`,
    type: timerInput.type,
    name: timerInput.name,
    label: timerInput.label || "",
    activityId: timerInput.activityId || null,
    journeyId: timerInput.journeyId || null,
    visual: timerInput.visual || null,
    startedAt: now,
    durationSeconds,
    pausedAt: null,
    totalPausedMs: 0,
    endsAt: now + durationSeconds * 1000,
    status: TIMER_STATUS.running,
    completedReason: null,
    screenLocked: false
  };

  state.data.activeTimer = activeTimer;
  resetTimerAudioFlags(activeTimer.id);
  saveData(state.data);
  setData(state.data);
  setScreen(APP_SCREENS.timer);
  playAppSound(SOUND.ids.start);
  requestWakeLock(state.data.settings.keepScreenAwake);
  startTicker();
  startInProgress = false;
}

export function startTicker() {
  stopTicker();
  recalculateTimer();
  const timer = getState().data?.activeTimer;
  if (timer && timer.status === TIMER_STATUS.running) {
    intervalId = window.setInterval(recalculateTimer, TIMER_LIMITS.tickMs);
  }
}

export function stopTicker() {
  if (intervalId) window.clearInterval(intervalId);
  intervalId = null;
}

export function recalculateTimer() {
  const state = getState();
  const timer = state.data?.activeTimer;
  if (!timer) {
    stopTicker();
    setTimerRuntime({ remainingSeconds: 0, progress: 0, status: TIMER_STATUS.idle });
    return;
  }

  if (timer.status === TIMER_STATUS.paused) {
    const remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - timer.pausedAt) / 1000));
    setTimerRuntime(runtimeFrom(timer, remainingSeconds));
    return;
  }

  if (timer.status === TIMER_STATUS.completed) {
    setTimerRuntime(runtimeFrom(timer, 0));
    return;
  }

  const remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  if (remainingSeconds <= 0) {
    completeTimer(HISTORY_REASONS.time);
    return;
  }
  playCountdownCues(timer, remainingSeconds);
  setTimerRuntime(runtimeFrom(timer, remainingSeconds));
}

export function pauseTimer() {
  const state = getState();
  const timer = state.data.activeTimer;
  if (!timer || timer.status !== TIMER_STATUS.running) return;
  timer.pausedAt = Date.now();
  timer.status = TIMER_STATUS.paused;
  saveAndRefresh();
  stopTicker();
}

export function resumeTimer() {
  const state = getState();
  const timer = state.data.activeTimer;
  if (!timer || timer.status !== TIMER_STATUS.paused) return;
  const now = Date.now();
  const pausedMs = now - timer.pausedAt;
  timer.totalPausedMs += pausedMs;
  timer.endsAt += pausedMs;
  timer.pausedAt = null;
  timer.status = TIMER_STATUS.running;
  saveAndRefresh();
  startTicker();
}

export function restartTimer() {
  const state = getState();
  const timer = state.data.activeTimer;
  if (!timer) return;
  const now = Date.now();
  timer.startedAt = now;
  timer.pausedAt = null;
  timer.totalPausedMs = 0;
  timer.endsAt = now + timer.durationSeconds * 1000;
  timer.status = TIMER_STATUS.running;
  timer.completedReason = null;
  timer.screenLocked = false;
  resetTimerAudioFlags(timer.id);
  saveAndRefresh();
  requestWakeLock(state.data.settings.keepScreenAwake);
  startTicker();
}

export function addOneMinute() {
  const state = getState();
  const timer = state.data.activeTimer;
  if (!timer || timer.status === TIMER_STATUS.completed) return;
  ensureTimerAudioFlags(timer);
  timer.durationSeconds += TIMER_LIMITS.addMinuteSeconds;
  timer.endsAt += TIMER_LIMITS.addMinuteSeconds * 1000;
  const remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  if (remainingSeconds > 10) timerAudioFlags.almostDonePlayed = false;
  saveAndRefresh();
  if (timer.status === TIMER_STATUS.running) startTicker();
}

export function completeTimer(reason = HISTORY_REASONS.early) {
  const state = getState();
  const timer = state.data.activeTimer;
  if (!timer || timer.status === TIMER_STATUS.completed) return;
  ensureTimerAudioFlags(timer);
  timer.status = TIMER_STATUS.completed;
  timer.completedReason = reason;
  timer.screenLocked = false;
  addHistory(state.data, timer, reason);
  saveData(state.data);
  setData(state.data);
  setTimerRuntime(runtimeFrom(timer, 0));
  stopTicker();
  releaseWakeLock();
  if (!timerAudioFlags.finishPlayed) {
    timerAudioFlags.finishPlayed = true;
    playAppSound(SOUND.ids.finish);
  }
  vibrateCompletion();
}

export function finishAndGoHome() {
  const state = getState();
  stopTicker();
  state.data.activeTimer = null;
  resetTimerAudioFlags();
  saveData(state.data);
  setData(state.data);
  releaseWakeLock();
  setScreen(APP_SCREENS.home);
}

export function initializeTimerRuntime() {
  const timer = getState().data?.activeTimer;
  if (timer && timer.status === TIMER_STATUS.running) {
    startTicker();
    return;
  }
  recalculateTimer();
}

export function setScreenLocked(locked) {
  const state = getState();
  if (!state.data.activeTimer) return;
  state.data.activeTimer.screenLocked = locked;
  saveAndRefresh();
}

function saveAndRefresh() {
  const state = getState();
  saveData(state.data);
  setData(state.data);
  recalculateTimer();
}

function resetTimerAudioFlags(timerId = null) {
  timerAudioFlags.timerId = timerId;
  timerAudioFlags.almostDonePlayed = false;
  timerAudioFlags.finishPlayed = false;
}

function ensureTimerAudioFlags(timer) {
  if (timerAudioFlags.timerId === timer?.id) return;
  resetTimerAudioFlags(timer?.id || null);
}

function playCountdownCues(timer, remainingSeconds) {
  ensureTimerAudioFlags(timer);
  const settings = getState().data?.settings;
  if (timer.type !== TIMER_TYPES.countdown) return;
  if (!settings?.intermediateSoundsEnabled) return;
  if (timerAudioFlags.almostDonePlayed) return;
  if (remainingSeconds <= 10) {
    timerAudioFlags.almostDonePlayed = true;
    playAppSound(SOUND.ids.almostDone);
  }
}

function runtimeFrom(timer, remainingSeconds) {
  return {
    remainingSeconds,
    progress: timer.durationSeconds ? Math.min(1, Math.max(0, 1 - remainingSeconds / timer.durationSeconds)) : 0,
    status: timer.status
  };
}

function addHistory(data, timer, reason) {
  data.history = [
    {
      id: `history-${Date.now()}`,
      completedAt: new Date().toISOString(),
      profileId: data.activeProfileId,
      type: timer.type,
      name: timer.name || timer.label,
      plannedDurationSeconds: timer.durationSeconds,
      completedReason: reason
    },
    ...data.history
  ].slice(0, STORAGE.historyLimit);
}

function clampDuration(seconds) {
  return Math.max(1, Math.min(seconds, TIMER_LIMITS.maxDurationMinutes * 60));
}
