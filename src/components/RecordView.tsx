import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAudioLevel } from '../hooks/useAudioLevel';
import { useCamera } from '../hooks/useCamera';
import { useFullscreen } from '../hooks/useFullscreen';
import { useIdle } from '../hooks/useIdle';
import type { RecorderApi } from '../hooks/useRecorder';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTeleprompter } from '../hooks/useTeleprompter';
import type { Script, Settings } from '../types';
import { detectSupport } from '../utils/compat';
import { QUALITY_PROFILES, downloadUrl, timestampName } from '../utils/media';
import { clamp, countWords, formatBytes, formatClock } from '../utils/text';
import { CameraPreview } from './CameraPreview';
import { Countdown } from './Countdown';
import { DownloadIcon, SwitchCameraIcon, VideoIcon } from './icons';
import { PresenterStage } from './PresenterStage';
import { RecordingControls } from './RecordingControls';
import { ScriptStats } from './ScriptStats';
import { SettingsPanel } from './SettingsPanel';
import { Teleprompter } from './Teleprompter';
import { Banner, Button, IconButton } from './ui';
import { VideoPreview } from './VideoPreview';

interface Props {
  script: Script;
  settings: Settings;
  onChangeSettings: (patch: Partial<Settings>) => void;
  onResetSettings: () => void;
  recorder: RecorderApi;
}

export function RecordView({ script, settings, onChangeSettings, onResetSettings, recorder }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [cameraOn, setCameraOn] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hud, setHud] = useState<string | null>(null);
  const hudTimer = useRef<number | null>(null);
  const cdTimer = useRef<number | null>(null);

  const words = countWords(script.body);
  const recState = recorder.state;
  const recActive = recState !== 'idle';

  const camera = useCamera({
    enabled: cameraOn,
    videoDeviceId: settings.videoDeviceId,
    audioDeviceId: settings.audioDeviceId,
    height: QUALITY_PROFILES[settings.quality].height,
    onDeviceFallback: useCallback(() => onChangeSettings({ videoDeviceId: '' }), [onChangeSettings]),
  });
  const micLevel = useAudioLevel(camera.stream);

  const flash = useCallback((msg: string) => {
    setHud(msg);
    if (hudTimer.current) window.clearTimeout(hudTimer.current);
    hudTimer.current = window.setTimeout(() => setHud(null), 1100);
  }, []);

  const tp = useTeleprompter({
    speed: settings.speed * scale,
    onEnd: () => flash('End of script'),
  });
  const fs = useFullscreen(stageRef);

  // Keep text size / scroll speed visually constant between windowed and fullscreen.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.max(0.2, el.clientWidth / 1280)));
    ro.observe(el);
    setScale(Math.max(0.2, el.clientWidth / 1280));
    return () => ro.disconnect();
  }, []);

  // Latest values for timers/callbacks that outlive a render.
  const latest = useRef({ stream: camera.stream, sync: settings.scrollMode === 'sync' });
  useEffect(() => {
    latest.current = { stream: camera.stream, sync: settings.scrollMode === 'sync' };
  });

  const clearCountdown = useCallback(() => {
    if (cdTimer.current !== null) window.clearTimeout(cdTimer.current);
    cdTimer.current = null;
    setCountdown(null);
  }, []);

  useEffect(
    () => () => {
      if (cdTimer.current !== null) window.clearTimeout(cdTimer.current);
      if (hudTimer.current !== null) window.clearTimeout(hudTimer.current);
    },
    [],
  );

  const beginRecording = useCallback(() => {
    const { stream, sync } = latest.current;
    if (!stream) return;
    if (recorder.start(stream) && sync) {
      tp.restart();
      tp.play(); // countdown → recording → scrolling, in that order
    }
  }, [recorder, tp]);

  const startRecording = useCallback(() => {
    if (!camera.stream || !recorder.supported || recorder.state !== 'idle' || cdTimer.current !== null) return;
    if (recorder.recording && !recorder.recording.downloaded && !window.confirm('This will replace your last recording, which has not been downloaded. Continue?')) {
      return;
    }
    if (latest.current.sync) {
      tp.pause();
      tp.restart(); // show the first lines while counting down
    }
    if (settings.countdownEnabled && settings.countdownSeconds > 0) {
      let n = settings.countdownSeconds;
      setCountdown(n);
      const tick = () => {
        n -= 1;
        if (n <= 0) {
          cdTimer.current = null;
          setCountdown(null);
          beginRecording();
        } else {
          setCountdown(n);
          cdTimer.current = window.setTimeout(tick, 1000);
        }
      };
      cdTimer.current = window.setTimeout(tick, 1000);
    } else {
      beginRecording();
    }
  }, [camera.stream, recorder, tp, settings.countdownEnabled, settings.countdownSeconds, beginRecording]);

  const stopRecording = useCallback(() => {
    recorder.stop();
    tp.pause();
  }, [recorder, tp]);

  const recordToggle = useCallback(() => {
    if (countdown !== null) clearCountdown();
    else if (recorder.state !== 'idle') stopRecording();
    else startRecording();
  }, [countdown, clearCountdown, recorder.state, stopRecording, startRecording]);

  const pauseResume = useCallback(() => {
    if (recorder.state === 'recording') {
      recorder.pause();
      if (latest.current.sync) tp.pause();
    } else if (recorder.state === 'paused') {
      recorder.resume();
      if (latest.current.sync) tp.play();
    }
  }, [recorder, tp]);

  // Ref so rapid key repeats compound correctly even before React re-renders.
  const speedRef = useRef(settings.speed);
  useEffect(() => {
    speedRef.current = settings.speed;
  }, [settings.speed]);
  const changeSpeed = useCallback(
    (delta: number) => {
      const next = clamp(Math.round((speedRef.current + delta) * 2) / 2, 1, 200);
      speedRef.current = next;
      onChangeSettings({ speed: next });
      flash(`Speed ${next}`);
    },
    [onChangeSettings, flash],
  );

  const jump = useCallback((dir: -1 | 1) => tp.jump(dir * Math.max(120, tp.viewportHeight * 0.4)), [tp]);

  // A finished recording → leave fullscreen and show the playback dialog.
  const recordingUrl = recorder.recording?.url;
  useEffect(() => {
    if (recordingUrl) {
      setShowResult(true);
      void fs.exit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingUrl]);

  // Leaving fullscreen closes the in-stage settings drawer.
  useEffect(() => {
    if (!fs.isFullscreen) setSettingsOpen(false);
  }, [fs.isFullscreen]);

  useShortcuts(
    {
      Space: () => {
        tp.toggle();
      },
      r: () => {
        tp.restart();
        flash('Restarted');
      },
      ArrowUp: () => changeSpeed(2),
      ArrowDown: () => changeSpeed(-2),
      ArrowLeft: () => jump(-1),
      ArrowRight: () => jump(1),
      f: () => void fs.toggle(),
      Enter: recordToggle,
      p: pauseResume,
      Escape: () => {
        if (countdown !== null) clearCountdown();
        else if (fs.isFullscreen) void fs.exit();
      },
    },
    !showResult,
  );

  const idle = useIdle(fs.isFullscreen && settings.autoHideControls && !settingsOpen, settings.hideDelaySeconds * 1000);
  const chromeHidden = fs.isFullscreen && idle;

  const support = detectSupport();
  const canRecord = !!camera.stream && recorder.supported && support.mediaRecorder;
  const recordingLocked = recActive || countdown !== null;
  const rec = recorder.recording;

  const switchCamera = () => {
    if (camera.videos.length < 2) return;
    const i = camera.videos.findIndex((d) => d.deviceId === camera.activeVideoId);
    onChangeSettings({ videoDeviceId: camera.videos[(i + 1) % camera.videos.length].deviceId });
  };

  const controls = (compact: boolean) => (
    <RecordingControls
      recState={recState}
      counting={countdown !== null}
      elapsedMs={recorder.elapsedMs}
      canRecord={canRecord}
      scrolling={tp.playing}
      settings={settings}
      micLevel={micLevel}
      hasMic={camera.micStatus === 'ok' && !!camera.stream}
      isFullscreen={fs.isFullscreen}
      compact={compact}
      settingsOpen={settingsOpen}
      onChangeSettings={onChangeSettings}
      onRecordToggle={recordToggle}
      onPauseResume={pauseResume}
      onTogglePlay={tp.toggle}
      onRestart={tp.restart}
      onJump={jump}
      onSpeed={changeSpeed}
      onFullscreen={() => void fs.toggle()}
      onToggleSettings={compact ? () => setSettingsOpen((o) => !o) : undefined}
    />
  );

  const settingsPanel = (className = '') => (
    <SettingsPanel
      className={className}
      settings={settings}
      onChange={onChangeSettings}
      onReset={onResetSettings}
      camera={camera}
      locked={recordingLocked}
      cameraEnabled={cameraOn}
      onCameraEnabled={setCameraOn}
      words={words}
      textHeight={tp.textHeight}
      scale={scale}
    />
  );

  return (
    <div className="mx-auto grid w-full max-w-[1700px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-w-0 flex-col gap-3">
        {!support.mediaRecorder && (
          <Banner tone="error">
            <b>This browser can’t record video</b> (MediaRecorder is missing). You can still preview and rehearse, but to record please use a current
            Chrome, Edge, Firefox or Safari.
          </Banner>
        )}
        {recorder.error && (
          <Banner tone="error" action={<Button size="sm" onClick={recorder.clearError}>Dismiss</Button>}>
            {recorder.error}
          </Banner>
        )}
        {camera.stream && (camera.micStatus === 'denied' || camera.micStatus === 'unavailable') && (
          <Banner
            tone="warn"
            action={
              <Button size="sm" onClick={camera.retry} disabled={recordingLocked}>
                Retry microphone
              </Button>
            }
          >
            {camera.micStatus === 'denied' ? (
              <>
                <b>Microphone access is blocked.</b> You can still record <b>video only</b>. To add sound, allow the microphone from the lock icon in the
                address bar, then retry.
              </>
            ) : (
              <>
                <b>No usable microphone.</b> Recording will be video only. Pick another microphone in Settings → Camera, or plug one in and retry.
              </>
            )}
          </Banner>
        )}

        <PresenterStage
          stageRef={stageRef}
          isFullscreen={fs.isFullscreen}
          pseudoFullscreen={fs.pseudo}
          cursorHidden={chromeHidden}
          recState={recState}
          elapsedMs={recorder.elapsedMs}
          hud={hud}
        >
          <CameraPreview
            camera={camera}
            mirror={settings.mirrorPreview}
            fit={fs.isFullscreen ? 'contain' : 'cover'}
            enabled={cameraOn}
            onEnable={() => setCameraOn(true)}
          />
          <Teleprompter
            text={script.body}
            settings={settings}
            scale={scale}
            tp={tp}
            recording={recActive}
            onLayoutChange={(overlay) => onChangeSettings({ overlay })}
          />
          {camera.videos.length > 1 && !recordingLocked && camera.stream && (
            <div className="absolute right-3 top-3 z-20">
              <IconButton label="Switch camera" onClick={switchCamera} className="bg-black/60">
                <SwitchCameraIcon />
              </IconButton>
            </div>
          )}
          {countdown !== null && <Countdown value={countdown} onCancel={clearCountdown} />}

          {fs.isFullscreen && (
            <>
              <div
                className={`absolute inset-x-3 bottom-3 z-40 transition-opacity duration-300 ${
                  chromeHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                {controls(true)}
              </div>
              {settingsOpen && (
                <div className="absolute inset-y-3 right-3 z-40 w-[340px] max-w-[90%] overflow-y-auto rounded-xl bg-zinc-950/95 p-3 pb-20 ring-1 ring-white/10 backdrop-blur-md">
                  {settingsPanel()}
                </div>
              )}
            </>
          )}
        </PresenterStage>

        {!fs.isFullscreen && controls(false)}

        {!fs.isFullscreen && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <ScriptStats text={script.body} wpm={settings.wpm} progress={tp.progress} />
            {rec && !showResult && (
              <div className="flex items-center gap-2 text-xs text-zinc-400" data-testid="last-take">
                <VideoIcon width={14} height={14} className="text-rose-400" />
                Last take {formatClock(rec.durationMs)} · {formatBytes(rec.size)}
                <Button size="sm" onClick={() => setShowResult(true)}>
                  View
                </Button>
                <Button size="sm" onClick={() => { downloadUrl(rec.url, timestampName(rec.ext, new Date(rec.createdAt))); recorder.markDownloaded(); }}>
                  <DownloadIcon width={14} height={14} /> Download
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="min-w-0 lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto lg:pr-1">{settingsPanel()}</aside>

      {showResult && rec && (
        <VideoPreview
          recording={rec}
          onClose={() => setShowResult(false)}
          onDownloaded={recorder.markDownloaded}
          onDelete={() => {
            recorder.discard();
            setShowResult(false);
          }}
          onRecordAgain={() => {
            recorder.discard();
            setShowResult(false);
            tp.restart();
          }}
        />
      )}
    </div>
  );
}
