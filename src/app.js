import { APP_SCREENS } from "./config.js";
import { setActiveLanguage } from "./i18n.js";
import { setData, setScreen, subscribe } from "./state.js";
import { loadData, saveData } from "./storage.js";
import { renderApp } from "./ui.js";
import { registerServiceWorker } from "./pwa.js";
import { initializeTimerRuntime } from "./timerEngine.js";

const data = loadData();
setActiveLanguage(data.settings.language);
setData(data);
setScreen(data.onboardingCompleted ? APP_SCREENS.home : APP_SCREENS.onboarding);
subscribe(renderApp);
renderApp();
saveData(data);
registerServiceWorker();
initializeTimerRuntime();
