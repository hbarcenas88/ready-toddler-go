import { SOUND } from "./config.js";
import { getSoundAsset } from "./assets.js";
import { getState } from "./state.js";

let audioContext;
let audioUnlocked = false;
let listenersBound = false;
const audioCache = new Map();
const warnedMessages = new Set();

const FALLBACK_NOTES = {
  [SOUND.ids.start]: [[392, 90], [523.25, 130]],
  [SOUND.ids.almostDone]: [[659.25, 70], [659.25, 70], [784, 100]],
  [SOUND.ids.finish]: [[523.25, 100], [659.25, 120], [783.99, 180]],
  [SOUND.ids.progressSoft]: [[587.33, 80]],
  [SOUND.ids.tap]: [[440, 45]],
  [SOUND.ids.completeSoft]: [[523.25, 100], [659.25, 120], [783.99, 180]],
  [SOUND.ids.completeNoticeable]: [[523.25, 100], [659.25, 120], [783.99, 180]]
};

function warnOnce(key, message, error) {
  if (warnedMessages.has(key)) return;
  warnedMessages.add(key);
  console.warn(message, error || "");
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  return audioContext;
}

function volumeForSettings(options = {}) {
  const { data } = getState();
  const noticeable = data?.settings?.soundIntensity === SOUND.intensity.noticeable;
  const baseVolume = noticeable ? 0.42 : 0.24;
  return Math.max(0, Math.min(1, options.volume ?? baseVolume));
}

export function isAudioEnabled() {
  return Boolean(getState().data?.settings?.soundEnabled);
}

export function preloadSounds() {
  Object.values(SOUND.ids).forEach((soundId) => {
    const asset = getSoundAsset(soundId);
    if (!asset || audioCache.has(soundId)) return;
    const audio = new Audio(asset);
    audio.preload = "auto";
    audioCache.set(soundId, audio);
  });
}

export function unlockAudioOnFirstUserGesture() {
  if (listenersBound) return;
  listenersBound = true;

  const unlock = () => {
    const context = getAudioContext();
    if (context?.state === "suspended") {
      context.resume().catch((error) => {
        warnOnce("context-resume", "Toddler Go audio context could not be resumed.", error);
      });
    }

    audioUnlocked = true;
    preloadSounds();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function playTone(frequency, durationMs, gainValue) {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended" && audioUnlocked) {
    context.resume().catch((error) => {
      warnOnce("context-resume-tone", "Toddler Go fallback tone could not resume audio.", error);
    });
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(gainValue, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationMs / 1000);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + durationMs / 1000);
}

function playFallbackTone(soundId, volume) {
  const notes = FALLBACK_NOTES[soundId] || FALLBACK_NOTES[SOUND.ids.tap];
  let delay = 0;
  notes.forEach(([frequency, duration]) => {
    window.setTimeout(() => playTone(frequency, duration, volume * 0.5), delay);
    delay += duration + 35;
  });
}

export async function playSound(soundId, options = {}) {
  if (!isAudioEnabled()) return;
  preloadSounds();
  const asset = getSoundAsset(soundId);
  const volume = volumeForSettings(options);

  if (asset) {
    const cachedAudio = audioCache.get(soundId) || new Audio(asset);
    audioCache.set(soundId, cachedAudio);

    try {
      cachedAudio.pause();
      cachedAudio.currentTime = 0;
      cachedAudio.volume = volume;
      await cachedAudio.play();
      return;
    } catch (error) {
      warnOnce(`audio-file-${soundId}`, `Toddler Go could not play audio file: ${asset}`, error);
    }
  }

  playFallbackTone(soundId, volume);
}

export function playAppSound(soundId, options) {
  playSound(soundId, options);
}

export function vibrateCompletion() {
  const { data } = getState();
  if (data?.settings?.vibrationEnabled && navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
}
