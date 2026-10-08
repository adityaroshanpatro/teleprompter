import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Options {
  /** Scroll speed in px per second (already scaled for the current stage size). Fractions are fine. */
  speed: number;
  /** Called once when the end of the script is reached while scrolling. */
  onEnd?: () => void;
}

/**
 * Time-based teleprompter scroll engine.
 *
 *  - Position lives in a ref and is written straight to `transform: translate3d` inside a
 *    requestAnimationFrame loop, so React never re-renders per frame.
 *  - Each frame advances by `speed × Δt` (Δt from the rAF timestamp, clamped), which keeps the
 *    speed identical on 30/60/120/144 Hz displays and with fractional speeds.
 *  - Jumps (← / →, wheel) are eased with exponential smoothing instead of teleporting.
 *  - The loop only runs while scrolling or easing; it idles at zero cost otherwise.
 *
 * Geometry: offset 0 puts the first line on the reading line; offset == textHeight puts the last
 * line there. The DOM is [spacer(readLine)] [text] [spacer(viewport)] inside `moverRef`.
 */
export function useTeleprompter({ speed, onEnd }: Options) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const offsetRef = useRef(0);
  const maxRef = useRef(0);
  const playingRef = useRef(false);
  const jumpRef = useRef(0); // remaining eased distance, px
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastReportRef = useRef(0);
  const speedRef = useRef(speed);
  const onEndRef = useRef(onEnd);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({ textHeight: 0, viewportHeight: 0 });

  useEffect(() => {
    speedRef.current = speed;
    onEndRef.current = onEnd;
  });

  const apply = useCallback(() => {
    const el = moverRef.current;
    if (el) el.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`;
  }, []);

  const report = useCallback((force = false, now = performance.now()) => {
    if (!force && now - lastReportRef.current < 100) return;
    lastReportRef.current = now;
    const max = maxRef.current;
    setProgress(max > 0 ? Math.min(1, Math.max(0, offsetRef.current / max)) : 0);
  }, []);

  const frame = useCallback(
    function tick(ts: number) {
      rafRef.current = 0;
      const dt = lastTsRef.current ? Math.min((ts - lastTsRef.current) / 1000, 0.1) : 0;
      lastTsRef.current = ts;

      if (playingRef.current) offsetRef.current += speedRef.current * dt;

      if (Math.abs(jumpRef.current) > 0) {
        const step = jumpRef.current * (1 - Math.exp(-dt * 12));
        offsetRef.current += step;
        jumpRef.current -= step;
        if (Math.abs(jumpRef.current) < 0.5) {
          offsetRef.current += jumpRef.current;
          jumpRef.current = 0;
        }
      }

      const max = maxRef.current;
      let ended = false;
      if (offsetRef.current < 0) {
        offsetRef.current = 0;
        jumpRef.current = Math.max(0, jumpRef.current);
      } else if (offsetRef.current >= max) {
        offsetRef.current = max;
        jumpRef.current = Math.min(0, jumpRef.current);
        if (playingRef.current && max > 0) ended = true;
      }

      apply();
      if (ended) {
        playingRef.current = false;
        setPlaying(false);
        report(true, ts);
        onEndRef.current?.();
        return;
      }
      report(false, ts);

      if (playingRef.current || jumpRef.current !== 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        lastTsRef.current = 0;
        report(true, ts);
      }
    },
    [apply, report],
  );

  const ensureLoop = useCallback(() => {
    if (!rafRef.current) {
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(frame);
    }
  }, [frame]);

  const play = useCallback(() => {
    if (maxRef.current > 0 && offsetRef.current >= maxRef.current - 0.5) {
      offsetRef.current = 0; // finished? play from the top
      jumpRef.current = 0;
    }
    playingRef.current = true;
    setPlaying(true);
    ensureLoop();
  }, [ensureLoop]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [pause, play]);

  /** Jump to the top. Keeps scrolling if it was scrolling. */
  const restart = useCallback(() => {
    offsetRef.current = 0;
    jumpRef.current = 0;
    apply();
    report(true);
    if (playingRef.current) ensureLoop();
  }, [apply, report, ensureLoop]);

  /** Eased relative jump in px (negative = back). */
  const jump = useCallback(
    (px: number) => {
      jumpRef.current += px;
      ensureLoop();
    },
    [ensureLoop],
  );

  /** Immediate relative scroll (mouse wheel). */
  const scrollBy = useCallback(
    (px: number) => {
      offsetRef.current = Math.min(maxRef.current, Math.max(0, offsetRef.current + px));
      apply();
      report(true);
    },
    [apply, report],
  );

  const seek = useCallback(
    (fraction: number) => {
      offsetRef.current = Math.min(1, Math.max(0, fraction)) * maxRef.current;
      jumpRef.current = 0;
      apply();
      report(true);
    },
    [apply, report],
  );

  // Re-measure when the text or viewport changes size, keeping the same reading position.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const tx = textRef.current;
    if (!vp || !tx) return;
    const measure = () => {
      const textHeight = tx.getBoundingClientRect().height;
      const viewportHeight = vp.getBoundingClientRect().height;
      const prevMax = maxRef.current;
      const ratio = prevMax > 0 ? offsetRef.current / prevMax : 0;
      maxRef.current = textHeight;
      offsetRef.current = prevMax > 0 ? ratio * textHeight : Math.min(offsetRef.current, textHeight);
      apply();
      setMetrics((m) =>
        m.textHeight === textHeight && m.viewportHeight === viewportHeight ? m : { textHeight, viewportHeight },
      );
      report(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    ro.observe(tx);
    return () => ro.disconnect();
  }, [apply, report]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    viewportRef,
    moverRef,
    textRef,
    playing,
    progress,
    textHeight: metrics.textHeight,
    viewportHeight: metrics.viewportHeight,
    play,
    pause,
    toggle,
    restart,
    jump,
    scrollBy,
    seek,
  };
}

export type TeleprompterApi = ReturnType<typeof useTeleprompter>;
