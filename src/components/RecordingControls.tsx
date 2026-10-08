import type { RecorderState } from '../hooks/useRecorder';
import type { Settings } from '../types';
import { formatClock } from '../utils/text';
import {
  BackIcon,
  ExitFullscreenIcon,
  ForwardIcon,
  FullscreenIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RecordIcon,
  RestartIcon,
  SlidersIcon,
  StopIcon,
} from './icons';
import { Button, IconButton, Select, Segmented } from './ui';

interface Props {
  recState: RecorderState;
  counting: boolean;
  elapsedMs: number;
  canRecord: boolean;
  scrolling: boolean;
  settings: Settings;
  micLevel: number;
  hasMic: boolean;
  isFullscreen: boolean;
  /** Fullscreen toolbar: fewer controls, glassy background. */
  compact?: boolean;
  settingsOpen?: boolean;
  onChangeSettings: (patch: Partial<Settings>) => void;
  onRecordToggle: () => void;
  onPauseResume: () => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onJump: (dir: -1 | 1) => void;
  onSpeed: (delta: number) => void;
  onFullscreen: () => void;
  onToggleSettings?: () => void;
}

export function RecordingControls(p: Props) {
  const recording = p.recState !== 'idle';
  const paused = p.recState === 'paused';
  const busy = recording || p.counting;

  return (
    <div
      data-testid="controls"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-3 py-2 ${
        p.compact ? 'bg-zinc-950/80 backdrop-blur-md ring-1 ring-white/10' : 'bg-zinc-900 ring-1 ring-zinc-800'
      }`}
    >
      {/* record group */}
      <div className="flex items-center gap-2">
        {busy ? (
          <Button variant="danger" size="lg" onClick={p.onRecordToggle} data-testid="stop-btn" title="Stop (Enter)">
            <StopIcon /> {p.counting ? 'Cancel' : 'Stop'}
          </Button>
        ) : (
          <Button variant="danger" size="lg" onClick={p.onRecordToggle} disabled={!p.canRecord} data-testid="record-btn" title="Start recording (Enter)">
            <RecordIcon /> Record
          </Button>
        )}
        {recording && (
          <Button size="lg" onClick={p.onPauseResume} data-testid="pause-rec-btn" title="Pause / resume recording (P)">
            {paused ? <PlayIcon /> : <PauseIcon />} {paused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <div
          data-testid="timer"
          aria-label="Recording duration"
          className={`min-w-[4.5rem] rounded-lg px-2 py-1 text-center font-mono text-lg tabular-nums ${
            recording ? (paused ? 'text-amber-300' : 'text-rose-300') : 'text-zinc-400'
          }`}
        >
          {formatClock(p.elapsedMs)}
        </div>
        {p.hasMic && (
          <div className="hidden sm:block h-2 w-14 overflow-hidden rounded-full bg-zinc-800" title="Microphone level" aria-label="Microphone level">
            <div className="h-full bg-emerald-400 transition-[width] duration-75" style={{ width: `${Math.round(p.micLevel * 100)}%` }} />
          </div>
        )}
      </div>

      {/* teleprompter transport */}
      <div className="flex items-center gap-1" role="group" aria-label="Teleprompter controls">
        <IconButton label="Restart from beginning (R)" onClick={p.onRestart} data-testid="restart-btn">
          <RestartIcon />
        </IconButton>
        <IconButton label="Scroll backward (←)" onClick={() => p.onJump(-1)}>
          <BackIcon />
        </IconButton>
        <Button onClick={p.onTogglePlay} className="w-24" data-testid="scroll-toggle" title="Pause / resume scrolling (Space)">
          {p.scrolling ? <PauseIcon /> : <PlayIcon />} {p.scrolling ? 'Pause' : 'Scroll'}
        </Button>
        <IconButton label="Scroll forward (→)" onClick={() => p.onJump(1)}>
          <ForwardIcon />
        </IconButton>
        <div className="ml-1 flex items-center gap-1" role="group" aria-label="Scroll speed">
          <IconButton label="Slower (↓)" onClick={() => p.onSpeed(-2)}>
            <MinusIcon />
          </IconButton>
          <span data-testid="speed-value" className="w-10 text-center text-sm tabular-nums text-zinc-300" title="Scroll speed">
            {p.settings.speed}
          </span>
          <IconButton label="Faster (↑)" onClick={() => p.onSpeed(2)}>
            <PlusIcon />
          </IconButton>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {p.onToggleSettings && (
          <IconButton label="Settings" onClick={p.onToggleSettings} active={p.settingsOpen}>
            <SlidersIcon />
          </IconButton>
        )}
        <IconButton label={p.isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen presenter mode (F)'} onClick={p.onFullscreen} data-testid="fullscreen-btn">
          {p.isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </IconButton>
      </div>

      {/* recording options */}
      {!p.compact && (
        <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-800 pt-2 text-xs text-zinc-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              data-testid="countdown-toggle"
              checked={p.settings.countdownEnabled}
              disabled={busy}
              onChange={(e) => p.onChangeSettings({ countdownEnabled: e.target.checked })}
              className="accent-sky-400"
            />
            Countdown
          </label>
          <label className="flex items-center gap-2">
            Duration
            <Select
              aria-label="Countdown duration"
              data-testid="countdown-seconds"
              value={p.settings.countdownSeconds}
              disabled={busy || !p.settings.countdownEnabled}
              onChange={(e) => {
                p.onChangeSettings({ countdownSeconds: Number(e.target.value) });
                e.currentTarget.blur();
              }}
              className="!w-auto !py-1 text-xs"
            >
              {[1, 2, 3, 5, 10].map((s) => (
                <option key={s} value={s}>
                  {s}s
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-center gap-2">
            Scrolling
            <div className="w-56">
              <Segmented
                label="Scroll start mode"
                value={p.settings.scrollMode}
                onChange={(v) => p.onChangeSettings({ scrollMode: v })}
                options={[
                  { value: 'sync', label: 'Starts with recording', title: 'Scrolling starts when the countdown ends and recording begins' },
                  { value: 'manual', label: 'Manual', title: 'You start and stop scrolling yourself, any time' },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
