export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return { supported: false };
  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js");
    return { supported: true, registration };
  } catch (error) {
    return { supported: true, error };
  }
}

export async function clearAppCaches() {
  if (!("caches" in window)) return false;
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith("ready-toddler-go-")).map((key) => caches.delete(key)));
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.update()));
  }
  return true;
}

let wakeLock;

export async function requestWakeLock(enabled) {
  if (!enabled || !("wakeLock" in navigator)) return false;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    return true;
  } catch {
    wakeLock = null;
    return false;
  }
}

export async function releaseWakeLock() {
  if (!wakeLock) return;
  try {
    await wakeLock.release();
  } catch {
    // Ignore browser-specific wake lock release failures.
  }
  wakeLock = null;
}
