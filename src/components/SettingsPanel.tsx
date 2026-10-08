import type { ReactNode } from 'react';
import { FONT_LABELS } from '../defaults';
import type { CameraApi } from '../hooks/useCamera';
import type { Align, FontKey, Quality, Settings } from '../types';
import { QUALITY_PROFILES } from '../utils/media';
import { Button, Field, Segmented, Select, Slider, Toggle } from './ui';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  camera: CameraApi;
  /** Devices/quality can't change mid-recording. */
  locked: boolean;
  cameraEnabled: boolean;
  onCameraEnabled: (v: boolean) => void;
  /** Used for the "match my WPM" helper. */
  words: number;
  textHeight: number;
  scale: number;
  className?: string;
}

const TEXT_COLORS = ['#ffffff', '#fde68a', '#bbf7d0', '#bae6fd', '#fecaca', '#000000'];

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-zinc-800 bg-zinc-900/60">
      <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200">
        {title}
        <span className="text-zinc-600 transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 px-3 pb-3">{children}</div>
    </details>
  );
}

export function SettingsPanel({ settings: s, onChange, onReset, camera, locked, cameraEnabled, onCameraEnabled, words, textHeight, scale, className = '' }: Props) {
  const estWpm = textHeight > 0 && words > 0 ? Math.round(((s.speed * scale * 60) / textHeight) * words) : 0;
  const matchWpm = () => {
    if (textHeight <= 0 || words <= 0 || scale <= 0) return;
    const eff = (s.wpm * textHeight) / (words * 60); // px/s on screen
    onChange({ speed: Math.min(200, Math.max(1, Math.round((eff / scale) * 2) / 2)) });
  };

  const videoValue = camera.videos.some((d) => d.deviceId === s.videoDeviceId) ? s.videoDeviceId : camera.activeVideoId;
  const audioValue = s.audioDeviceId === 'off' ? 'off' : camera.audios.some((d) => d.deviceId === s.audioDeviceId) ? s.audioDeviceId : camera.activeAudioId || '';

  return (
    <div className={`space-y-3 ${className}`} data-testid="settings-panel">
      <Section title="Teleprompter">
        <Slider label="Font size" value={s.fontSize} min={20} max={140} unit="px" onChange={(fontSize) => onChange({ fontSize })} />
        <Slider
          label="Scroll speed"
          value={s.speed}
          min={1}
          max={200}
          step={0.5}
          unit="px/s"
          hint={estWpm ? `≈ ${estWpm} WPM` : undefined}
          onChange={(speed) => onChange({ speed })}
        />
        <Button size="sm" onClick={matchWpm} disabled={textHeight <= 0 || words <= 0} className="w-full" title="Set scroll speed so the script finishes in about the time your WPM setting predicts">
          Match speed to {s.wpm} WPM
        </Button>
        <Slider label="Line spacing" value={s.lineHeight} min={1} max={2.5} step={0.05} onChange={(lineHeight) => onChange({ lineHeight })} />
        <Slider label="Text width" value={s.textWidth} min={30} max={100} unit="%" onChange={(textWidth) => onChange({ textWidth })} />
        <Field label="Alignment">
          <Segmented<Align>
            label="Text alignment"
            value={s.align}
            onChange={(align) => onChange({ align })}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Field>
        <Field label="Font">
          <Select value={s.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value as FontKey })}>
            {(Object.keys(FONT_LABELS) as FontKey[]).map((k) => (
              <option key={k} value={k}>
                {FONT_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Text color">
            <input
              type="color"
              value={s.textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="h-8 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
            />
          </Field>
          <Field label="Background">
            <input
              type="color"
              value={s.bgColor}
              onChange={(e) => onChange({ bgColor: e.target.value })}
              className="h-8 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
            />
          </Field>
        </div>
        <div className="flex gap-1.5" aria-label="Text color presets">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Text color ${c}`}
              onClick={() => onChange({ textColor: c })}
              style={{ background: c }}
              className={`h-5 w-5 rounded-full border ${s.textColor === c ? 'border-sky-400 ring-2 ring-sky-400/40' : 'border-zinc-600'}`}
            />
          ))}
        </div>
        <Slider
          label="Background opacity"
          value={Math.round(s.bgOpacity * 100)}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => onChange({ bgOpacity: v / 100 })}
        />
        <Toggle label="Mirror text" hint="For beam-splitter glass teleprompters" checked={s.mirrorText} onChange={(mirrorText) => onChange({ mirrorText })} />
        <Toggle label="Reading-line markers" checked={s.showReadingLine} onChange={(showReadingLine) => onChange({ showReadingLine })} />
        <Slider label="Speaking pace (for estimates)" value={s.wpm} min={60} max={260} unit="WPM" onChange={(wpm) => onChange({ wpm })} />
      </Section>

      <Section title="Camera">
        <Toggle label="Camera on" checked={cameraEnabled} onChange={onCameraEnabled} disabled={locked} />
        <Field label="Camera">
          <Select
            value={videoValue}
            disabled={locked || camera.videos.length === 0}
            onChange={(e) => {
              onChange({ videoDeviceId: e.target.value });
              e.currentTarget.blur();
            }}
            data-testid="camera-select"
          >
            {camera.videos.length === 0 && <option value="">No camera detected</option>}
            {camera.videos.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Microphone" hint={camera.micStatus === 'denied' ? 'blocked — camera only' : camera.micStatus === 'unavailable' ? 'unavailable — camera only' : undefined}>
          <Select
            value={audioValue}
            disabled={locked}
            onChange={(e) => {
              onChange({ audioDeviceId: e.target.value });
              e.currentTarget.blur();
            }}
            data-testid="mic-select"
          >
            {camera.audios.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
            {camera.audios.length === 0 && <option value="">Default microphone</option>}
            <option value="off">No microphone (video only)</option>
          </Select>
        </Field>
        <Toggle label="Mirror preview" hint="Only the preview — recordings are never flipped" checked={s.mirrorPreview} onChange={(mirrorPreview) => onChange({ mirrorPreview })} />
      </Section>

      <Section title="Recording">
        <Toggle label="Countdown before recording" checked={s.countdownEnabled} disabled={locked} onChange={(countdownEnabled) => onChange({ countdownEnabled })} />
        <Slider label="Countdown length" value={s.countdownSeconds} min={1} max={10} unit="s" disabled={locked || !s.countdownEnabled} onChange={(countdownSeconds) => onChange({ countdownSeconds })} />
        <Field label="Scrolling starts">
          <Segmented
            label="Scroll start mode"
            value={s.scrollMode}
            onChange={(scrollMode) => onChange({ scrollMode })}
            options={[
              { value: 'sync', label: 'With recording' },
              { value: 'manual', label: 'Manually' },
            ]}
          />
        </Field>
        <Field label="Quality" hint={locked ? 'locked while recording' : undefined}>
          <Select value={s.quality} disabled={locked} onChange={(e) => onChange({ quality: e.target.value as Quality })}>
            {(Object.keys(QUALITY_PROFILES) as Quality[]).map((q) => (
              <option key={q} value={q}>
                {QUALITY_PROFILES[q].label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Presenter mode" defaultOpen={false}>
        <Toggle label="Auto-hide controls in fullscreen" checked={s.autoHideControls} onChange={(autoHideControls) => onChange({ autoHideControls })} />
        <Slider label="Hide after" value={s.hideDelaySeconds} min={1} max={10} unit="s" disabled={!s.autoHideControls} onChange={(hideDelaySeconds) => onChange({ hideDelaySeconds })} />
      </Section>

      <Button variant="ghost" size="sm" onClick={onReset} className="w-full text-zinc-400">
        Reset appearance &amp; recording settings
      </Button>
    </div>
  );
}
