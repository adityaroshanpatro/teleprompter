import { useCallback, useEffect, useState, type RefObject } from 'react';
import { currentFullscreenElement, exitFullscreen, requestFullscreen } from '../utils/compat';

/**
 * Fullscreen for one element. If the browser refuses the Fullscreen API (or lacks it), falls back
 * to a CSS "pseudo fullscreen" that fills the browser window, so presenter mode still works.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false);
  const [pseudo, setPseudo] = useState(false);

  useEffect(() => {
    const sync = () => setNative(!!ref.current && currentFullscreenElement() === ref.current);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, [ref]);

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    const ok = await requestFullscreen(el);
    if (!ok) setPseudo(true);
  }, [ref]);

  const exit = useCallback(async () => {
    setPseudo(false);
    await exitFullscreen();
  }, []);

  const isFullscreen = native || pseudo;
  const toggle = useCallback(() => (isFullscreen ? exit() : enter()), [isFullscreen, enter, exit]);

  // Leaving the page area while fullscreen shouldn't leave stale state behind.
  useEffect(() => () => void exitFullscreen(), []);

  return { isFullscreen, pseudo, enter, exit, toggle };
}
