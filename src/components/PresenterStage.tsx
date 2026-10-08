import type { ReactNode, RefObject } from 'react';
import type { RecorderState } from '../hooks/useRecorder';
import { formatClock } from '../utils/text';

interface Props {
  stageRef: RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  pseudoFullscreen: boolean;
  cursorHidden: boolean;
  recState: RecorderState;
  elapsedMs: number;
  hud: string | null;
  children: ReactNode;
}

/**
 * The 16:9 "studio": camera video at the back, teleprompter panel on top, status badges,
 * and (in fullscreen) the floating controls passed in as children. This element itself is
 * what goes fullscreen, so everything inside stays available.
 */
export function PresenterStage({ stageRef, isFullscreen, pseudoFullscreen, cursorHidden, recState, elapsedMs, hud, children }: Props) {
  const style = isFullscreen
    ? { width: '100%', height: '100%' }
    : { width: 'min(100%, calc((100vh - 300px) * 16 / 9))', minWidth: 'min(100%, 480px)', aspectRatio: '16 / 9' };

  return (
    <div
      ref={stageRef}
      data-testid="stage"
      style={style}
      className={`overflow-hidden bg-black ${
        isFullscreen
          ? pseudoFullscreen
            ? 'fixed inset-0 z-50 rounded-none'
            : 'relative rounded-none'
          : 'relative mx-auto rounded-xl ring-1 ring-zinc-800'
      } ${cursorHidden ? 'cursor-none' : ''}`}
    >
      {children}

      {recState !== 'idle' && (
        <div
          data-testid="rec-indicator"
          className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${recState === 'paused' ? 'bg-amber-400' : 'animate-pulse-rec bg-rose-500'}`} />
          {recState === 'paused' ? 'PAUSED' : 'REC'}
          <span className="font-mono tabular-nums">{formatClock(elapsedMs)}</span>
        </div>
      )}

      {hud && (
        <div
          data-testid="hud"
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/70 px-4 py-2 text-lg font-semibold text-white"
        >
          {hud}
        </div>
      )}
    </div>
  );
}
