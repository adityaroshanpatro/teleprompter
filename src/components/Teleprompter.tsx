import { useRef, type PointerEvent as RPointerEvent } from 'react';
import { FONT_STACKS } from '../defaults';
import type { TeleprompterApi } from '../hooks/useTeleprompter';
import type { OverlayLayout, Settings } from '../types';
import { clamp, formatSeconds, hexToRgba } from '../utils/text';
import { GripIcon } from './icons';

/** Where on the panel the "current line" sits (fraction from the top). Near the top = near the camera. */
export const READ_LINE = 0.3;

interface Props {
  text: string;
  settings: Settings;
  /** stageWidth / 1280 — keeps text size and scroll speed visually identical in fullscreen. */
  scale: number;
  tp: TeleprompterApi;
  onLayoutChange: (layout: OverlayLayout) => void;
  recording: boolean;
}

type Drag = { kind: 'move' | 'resize'; startY: number; top: number; height: number; stageH: number };

export function Teleprompter({ text, settings, scale, tp, onLayoutChange, recording }: Props) {
  const { overlay } = settings;
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const begin = (kind: Drag['kind']) => (e: RPointerEvent<HTMLElement>) => {
    const stage = panelRef.current?.parentElement;
    if (!stage) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { kind, startY: e.clientY, top: overlay.top, height: overlay.height, stageH: stage.getBoundingClientRect().height };
  };
  const move = (e: RPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || d.stageH <= 0) return;
    const dy = ((e.clientY - d.startY) / d.stageH) * 100;
    if (d.kind === 'move') {
      onLayoutChange({ height: d.height, top: clamp(d.top + dy, 0, 100 - d.height) });
    } else {
      onLayoutChange({ top: d.top, height: clamp(d.height + dy, 15, 100 - d.top) });
    }
  };
  const end = () => {
    dragRef.current = null;
  };

  const speedPxPerSec = settings.speed * scale;
  const secondsLeft = speedPxPerSec > 0 ? Math.round(((1 - tp.progress) * tp.textHeight) / speedPxPerSec) : 0;

  return (
    <div
      ref={panelRef}
      data-testid="teleprompter"
      className="group absolute overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
      style={{
        top: `${overlay.top}%`,
        height: `${overlay.height}%`,
        left: '2%',
        right: '2%',
        background: hexToRgba(settings.bgColor, settings.bgOpacity),
      }}
    >
      {/* scrolling viewport */}
      <div
        ref={tp.viewportRef}
        className="absolute inset-0 overflow-hidden"
        onWheel={(e) => tp.scrollBy(e.deltaY)}
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 14%, #000 86%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 14%, #000 86%, transparent 100%)',
        }}
      >
        <div style={{ transform: settings.mirrorText ? 'scaleX(-1)' : undefined }} className="h-full w-full">
          <div ref={tp.moverRef} className="will-change-transform">
            <div style={{ height: tp.viewportHeight * READ_LINE }} />
            <div
              ref={tp.textRef}
              style={{
                width: `${settings.textWidth}%`,
                margin: '0 auto',
                fontSize: settings.fontSize * scale,
                lineHeight: settings.lineHeight,
                fontFamily: FONT_STACKS[settings.fontFamily],
                color: settings.textColor,
                textAlign: settings.align,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,.55)',
              }}
            >
              {text || 'Your script is empty. Add some text in the Script tab.'}
            </div>
            <div style={{ height: tp.viewportHeight }} />
          </div>
        </div>
      </div>

      {/* reading line marker */}
      {settings.showReadingLine && (
        <div className="pointer-events-none absolute inset-x-0" style={{ top: `${READ_LINE * 100}%` }} aria-hidden>
          <div className="absolute left-0 -translate-y-1/2 border-y-[9px] border-l-[14px] border-y-transparent border-l-sky-400/90" />
          <div className="absolute right-0 -translate-y-1/2 border-y-[9px] border-r-[14px] border-y-transparent border-r-sky-400/90" />
        </div>
      )}

      {/* drag handle (top) */}
      <div
        onPointerDown={begin('move')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        title="Drag to reposition the teleprompter"
        className="absolute inset-x-0 top-0 z-10 flex h-5 cursor-grab touch-none items-center justify-center bg-gradient-to-b from-black/50 to-transparent text-white/70 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripIcon width={16} height={16} />
      </div>

      {/* resize handle (bottom) */}
      <div
        onPointerDown={begin('resize')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        title="Drag to resize the teleprompter"
        className="absolute inset-x-0 bottom-0 z-10 flex h-4 cursor-ns-resize touch-none items-end justify-center opacity-0 transition-opacity group-hover:opacity-100"
      >
        <span className="mb-1 h-1 w-12 rounded-full bg-white/50" />
      </div>

      {/* status chip + progress */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] tabular-nums text-white/80">
        {Math.round(tp.progress * 100)}%
        {tp.textHeight > 0 && ` · ${formatSeconds(secondsLeft)} left`}
        {!tp.playing && !recording && ' · paused'}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 z-[5] h-1 cursor-pointer bg-white/10"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          tp.seek((e.clientX - r.left) / r.width);
        }}
        role="progressbar"
        aria-label="Script progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tp.progress * 100)}
      >
        <div className="h-full bg-sky-400/80" style={{ width: `${tp.progress * 100}%` }} />
      </div>
    </div>
  );
}
