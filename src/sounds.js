import { SOUND } from "./config.js";
import { getSoundAsset } from "./assets.js";
import { getState } from "./state.js";

let audioContext;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  return audioContext;
}

function playTone(frequency, durationMs, gainValue) {
  const context = getAudioContext();
  if (!context) return;

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

export function playAppSound(soundId) {
  const { data } = getState();
  if (!data?.settings?.soundEnabled) return;

  const asset = getSoundAsset(soundId);
  if (asset) {
    const audio = new Audio(asset);
    audio.play().catch(() => {});
    return;
  }

  const noticeable = data.settings.soundIntensity === SOUND.intensity.noticeable;
  const gain = noticeable ? 0.13 : 0.06;

  if (soundId === SOUND.ids.completeNoticeable || (soundId === SOUND.ids.completeSoft && noticeable)) {
    playTone(523.25, 120, gain);
    window.setTimeout(() => playTone(659.25, 160, gain), 130);
    return;
  }

  if (soundId === SOUND.ids.completeSoft) {
    playTone(440, 140, gain);
    window.setTimeout(() => playTone(554.37, 140, gain), 160);
    return;
  }

  playTone(soundId === SOUND.ids.start ? 392 : 330, 90, gain);
}

export function vibrateCompletion() {
  const { data } = getState();
  if (data?.settings?.vibrationEnabled && navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
}
