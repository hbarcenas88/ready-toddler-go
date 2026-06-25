# Ready, Toddler, Go!

Ready, Toddler, Go! is a mobile-first offline PWA for toddler routines and transitions. The short PWA name is Toddler Go!

The app helps an adult start quick visual countdowns or activity timers for common routines such as brushing teeth, washing hands, getting dressed, cleaning up toys, eating, using the bathroom, calming down, and leaving home. It is a calm support tool, not a medical tool or behavior scoring system.

## How to open locally

Use a local HTTP server. Avoid opening `index.html` directly with `file://`, because service workers and installable PWA behavior require a browser origin.

```powershell
python -m http.server 8809
```

Then open:

```text
http://127.0.0.1:8809/
```

## How to test in browser

1. Open the local URL.
2. Complete or skip onboarding.
3. Start a quick countdown from the Home chips.
4. Start an activity from the favorite activity cards.
5. Test pause, resume, add one minute, restart, finish/complete, lock screen, and long-press unlock.
6. Open Settings and test language, sound, usage mode, PIN, activity editing, export/import, history, and repair app.
7. Reload the page and verify saved state returns.

## PWA install

In Chrome or Edge, open the local or published HTTPS URL and use the browser install option. After the first successful load, the service worker caches the app shell and local assets so the app can reload offline.

## Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. In repository settings, enable Pages for the branch and folder that contains `index.html`.
3. Open the published HTTPS URL.
4. Install the PWA from the browser.

No build step is required.

## Clearing service worker/cache after updates

If an update does not appear:

1. Open Toddler Go!
2. Go to Settings.
3. Open Saved data.
4. Use Repair app.
5. Close and reopen the app.

For a stronger PWA repair, use the browser Application panel and clear service workers and cache storage for the site. Avoid broad `localStorage.clear()` actions on shared domains.

## Storage namespace safety

GitHub Pages project sites can share browser storage by domain. For example, two apps published under the same `github.io` origin may see the same `localStorage` area even when they live in different folders.

Toddler Go uses its own namespace:

```text
APP_STORAGE_PREFIX = rtg:
STORAGE_KEY = rtg:app:v1
```

Reset, import, export, and debug/storage views are scoped to Toddler Go data. They must only operate on keys that start with `rtg:`. The app also includes a one-time safe migration from the old key `readyToddlerGo.v1` to `rtg:app:v1`; it does not delete the old key automatically. Data Management includes an explicit action to remove only that old Toddler Go key.

Manual safety test:

```js
localStorage.setItem("finance:test", "do-not-delete")
```

Then run Reset App inside Toddler Go and confirm:

```js
localStorage.getItem("finance:test")
// "do-not-delete"
```

## Export/import

Export creates a JSON file with app name, data version, exported timestamp, settings, profiles, activities, countdown preferences, and recent history.

Import validates that the file belongs to Ready, Toddler, Go! and matches the current data version before replacing local data. Assets, browser cache, service workers, icons, images, and sound files are not exported.

## Folder structure

```text
/index.html
/manifest.webmanifest
/service-worker.js
/src
  app.js
  config.js
  state.js
  storage.js
  seedData.js
  timerEngine.js
  ui.js
  i18n.js
  assets.js
  sounds.js
  pwa.js
/styles
  tokens.css
  base.css
  components.css
  screens.css
/assets
  /icons
  /illustrations/journeys
  /illustrations/activities
  /sounds
```

## Adding future illustrations

Countdown journey scenes are centralized in `src/assets.js` under `ASSETS.journeyScenes`. V1 supports layered visuals for countdown journeys only; activity visuals still use the existing activity placeholder flow.

Use this exact folder shape for a layered countdown journey:

```text
assets/illustrations/journeys/
  dinosaur-cave/
    background.svg
    character.svg
    goal.svg
```

Expected file names:

```text
background.svg
character.svg
goal.svg
```

Allowed formats for V1 are `.svg`, `.png`, and `.webp`. SVG is recommended for simple vector/storybook art. PNG or WebP is better for painted premium artwork with transparent characters.

Recommended dimensions and weights:

```text
background: 1200x675 or 1000x600, ideally under 300 KB
character: transparent canvas, 512x512 or smaller, ideally under 150 KB
goal: transparent canvas, 512x512 or smaller, ideally under 150 KB
full journey: try to stay under 600 KB total
```

To add or replace a journey:

1. Add the files under `assets/illustrations/journeys/<journey-id>/`.
2. Update `ASSETS.journeyScenes` in `src/assets.js`.
3. Keep a `fallback` image for safety, usually `assets/illustrations/journeys/<journey-id>.svg`.
4. Add the new asset paths to `service-worker.js` so installed PWAs can load them offline.
5. Bump `APP_INFO.version` in `src/config.js` and `PWA_CACHE.appVersion` / `cacheName` in `service-worker.js`.

Example registry entry:

```js
"dinosaur-cave": {
  background: "assets/illustrations/journeys/dinosaur-cave/background.svg",
  character: "assets/illustrations/journeys/dinosaur-cave/character.svg",
  goal: "assets/illustrations/journeys/dinosaur-cave/goal.svg",
  fallback: "assets/illustrations/journeys/dinosaur-cave.svg",
  characterSize: "34%",
  startX: "4%",
  endX: "68%",
  bottom: "9%",
  goalRight: "5%",
  goalBottom: "9%",
  celebrationEmoji: "✨"
}
```

The UI must read paths, sizes, positions, and celebration values from the registry. If a layered asset is missing, the app falls back to the old single-image journey visual; if that is also missing, it uses the default journey asset instead of leaving the timer blank.

If old assets keep appearing after a replacement, open Settings > Data & maintenance > Repair app, then close and reopen the app. For a stronger browser-level reset, clear the service worker and Cache Storage for this site in DevTools > Application. Avoid broad `localStorage.clear()` on shared domains.

## Adding future sounds

Place local files under `assets/sounds`, add them to the sound registry in `src/assets.js`, and update `src/sounds.js` if the playback behavior needs to change. Keep Web Audio fallback available.

## Testing checklist

- Home buttons and bottom sheet menu work.
- Onboarding can be completed or skipped.
- Settings opens from gear and menu.
- Language switching works.
- Quick countdown chips start timers.
- Custom countdown rejects 0:00.
- Journey and visual preferences save.
- Activity timers start from Home and Activities.
- Pause, resume, add one minute, restart, complete early, finish now, and Home return work.
- Temporary screen lock disables controls and long-press unlock works.
- Child can touch mode asks for PIN setup and protects adult sections.
- Adult controls mode does not ask for PIN constantly.
- localStorage persists after reload.
- Export JSON downloads.
- Import validates app/data version.
- Reset and restore defaults work.
- Service worker registers.
- Offline reload works after first load.
- Mobile width is usable and tablet/desktop do not break.
- No external dependencies, CDNs, analytics, login, cloud, or remote APIs are used.

## Known limitations

- Illustrations and icons are placeholder local SVGs.
- Sounds are generated with the Web Audio API until real local sound files are added.
- Wake Lock depends on browser support.
- PIN hashing is practical for a local-only app, not a server-grade authentication system.
- Export/import covers app data only.

## V2 roadmap

- Multi-step routines and chained activities.
- Richer premium illustration packs.
- Richer local sound library.
- More visual themes.
- Portuguese language.
- Optional dark mode.
- More advanced child profiles.
- Optional 120-minute timer configuration.
