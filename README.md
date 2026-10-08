# Prompter — a fully local teleprompter + webcam recorder

Paste a script, watch it scroll right under your webcam preview while you read, and record yourself — all in the browser, all on your machine. No backend, no account, no API key, no uploads.

Stack: React 19 · TypeScript · Vite · Tailwind CSS · `getUserMedia` · `MediaRecorder` · `localStorage`.

## Features

- **Script editor** — large editor, autosave, rename, new / duplicate / clear / delete, "recent scripts" library, word & character count, estimated speaking time at an adjustable WPM (e.g. `1,245 words · ~8 min 53 sec`). A demo script is shown on first launch.
- **Teleprompter** — `requestAnimationFrame`, time-based scrolling (identical speed at 30/60/144 Hz, fractional speeds OK, no `setInterval` jumps). Font, size, speed, line spacing, text width, alignment, text/background colour, background opacity, mirror text, reading-line markers. The panel sits at the top of the video (near the lens) and can be **dragged and resized**. Click the progress bar to seek; mouse wheel scrolls.
- **Camera** — camera and microphone pickers, mirrored preview, live mic level meter, switch-camera button.
- **Recording** — optional countdown (1–10 s) → recording → scrolling, in that order ("with recording" mode), or a **Manual** mode where you start/stop scrolling yourself. Pause / resume, timer, REC indicator. After stopping: playback, duration, size, format, **Download**, **Delete**, **Record again**.
- **Fullscreen presenter mode** — the camera, text and a compact control bar go fullscreen together; controls auto-hide after a few seconds of inactivity (configurable) and reappear on mouse/key activity. Settings are available in a drawer.
- **Settings persist** locally (including device choice and teleprompter position).

## Install & run

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Open it at `http://localhost:5173` (camera access needs `localhost` or HTTPS).

## Build

```bash
npm run build      # typechecks, then writes ./dist
npm run preview    # serve the production build at http://localhost:4173
```

`dist/` is static; any static file server works. (Don't open `index.html` via `file://` — module scripts and camera access need http(s).) The production build injects a Content-Security-Policy with `connect-src 'none'`, so the browser itself blocks any network request from the page.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Pause / resume teleprompter |
| R | Restart from the top |
| ↑ / ↓ | Faster / slower |
| ← / → | Scroll backward / forward |
| Enter | Start / stop recording (cancels a countdown) |
| P | Pause / resume recording |
| F | Fullscreen |
| Esc | Exit fullscreen / cancel countdown |
| ? | Show shortcuts |

Shortcuts are ignored while typing in text fields and when Ctrl/Cmd/Alt is held. Press `?` or the keyboard icon for the in-app help.

## Browser requirements

A current Chrome, Edge, Firefox or Safari (desktop) with `getUserMedia`, `MediaRecorder` and the Fullscreen API. Recording format is auto-selected from what the browser supports: VP9/Opus WebM → VP8/Opus WebM → H.264 WebM → generic WebM → MP4 (Safari). Chromium browsers give the best results.

If `MediaRecorder` is missing, the app shows a compatibility notice and still works as a rehearsal teleprompter.

## Permissions

The Record tab asks for camera and microphone. If blocked, the app explains how to re-enable access (lock icon in the address bar → Allow, plus OS privacy settings). If only the microphone is blocked or missing, you can continue with **video-only** recording. There are dedicated messages for: no camera, camera in use by another app, camera unplugged mid-session, non-secure origin, unsupported browser.

## Where things are stored

| Data | Where | Lifetime |
| --- | --- | --- |
| Scripts, current script | `localStorage` (`prompter.scripts.v1`) | until you delete them / clear site data |
| Settings | `localStorage` (`prompter.settings.v1`) | same |
| **Recording** | **In memory only** (a Blob URL in the tab) | until you delete it, record again, or close/reload the tab |

**Download your take before closing the tab.** The app warns before a reload/close if a recording hasn't been downloaded. Recordings are never written to disk by the app and never uploaded.

## Privacy

No server, telemetry, fonts, CDNs or API calls — only system fonts, and the only network traffic is loading the app itself. Webcam, microphone, scripts and recordings never leave the browser. See `src/` — there is no `fetch`/`XMLHttpRequest`/`WebSocket` usage.

## How pause/resume works

Recording pause/resume uses `MediaRecorder.pause()` / `.resume()` — the browser-native, most reliable option. The paused period is **not** included in the file, and the on-screen timer matches. In "with recording" scroll mode, pausing the recording also pauses the teleprompter and resuming continues it. `Space` always controls only the teleprompter.

## Known limitations

- **No duration metadata in WebM.** `MediaRecorder` output has no duration header, so some players show no length or can't seek. The in-app preview works around this; for editing, remux/convert with e.g. `ffmpeg -i in.webm -c copy out.webm`, or import into a modern editor.
- **The teleprompter is not burned into the video** — only the camera and mic are recorded. The preview mirror setting doesn't flip the recording either.
- **Hidden tabs.** Browsers pause animation frames in background tabs, so the teleprompter stops scrolling if you switch tabs/windows (recording continues). Keep the tab visible.
- **Quality** options set the requested resolution (720p/1080p) and bitrate; the camera may deliver less. Changing quality or device restarts the camera and is locked during recording.
- **Safari** records MP4/H.264; Firefox/Chrome record WebM. Long, high-bitrate recordings are held in memory — very long sessions (an hour or more at "High") may be heavy.
- **Fullscreen**: if the browser refuses the Fullscreen API, the app falls back to filling the browser window.

## Project layout

```
src/
  components/  ScriptEditor, Teleprompter, CameraPreview, RecordingControls, SettingsPanel,
               Countdown, VideoPreview, PresenterStage (fullscreen), RecordView, ShortcutsHelp, ...
  hooks/       useCamera, useRecorder, useTeleprompter, useLocalStorage, useSettings, useScripts,
               useFullscreen, useIdle, useShortcuts, useAudioLevel
  utils/       compat (feature detection, format picking), media, keyboard, text
```
