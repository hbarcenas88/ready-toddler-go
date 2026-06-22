import { APP_SCREENS, TIMER_STATUS } from "./config.js";

const state = {
  data: null,
  screen: APP_SCREENS.home,
  onboardingStep: 0,
  bottomSheetOpen: false,
  modal: null,
  toast: "",
  timerRuntime: {
    remainingSeconds: 0,
    progress: 0,
    status: TIMER_STATUS.idle
  },
  unlockedProtectedSections: new Set()
};

const subscribers = new Set();

export function getState() {
  return state;
}

export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function notify() {
  subscribers.forEach((callback) => callback(state));
}

export function setData(data) {
  state.data = data;
  notify();
}

export function setScreen(screen) {
  state.screen = screen;
  state.bottomSheetOpen = false;
  state.modal = null;
  notify();
}

export function setOnboardingStep(step) {
  state.onboardingStep = step;
  notify();
}

export function setBottomSheetOpen(open) {
  state.bottomSheetOpen = open;
  notify();
}

export function setModal(modal) {
  state.modal = modal;
  notify();
}

export function setToast(message) {
  state.toast = message;
  notify();
  if (message) window.setTimeout(() => {
    if (state.toast === message) {
      state.toast = "";
      notify();
    }
  }, 2600);
}

export function setTimerRuntime(runtime) {
  state.timerRuntime = { ...state.timerRuntime, ...runtime };
  notify();
}

export function markProtectedSectionUnlocked(section) {
  state.unlockedProtectedSections.add(section);
  notify();
}

export function clearProtectedUnlocks() {
  state.unlockedProtectedSections.clear();
}
