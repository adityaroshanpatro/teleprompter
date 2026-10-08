import { useEffect, useRef } from 'react';
import { isTypingTarget } from '../utils/keyboard';

export type ShortcutMap = Partial<Record<string, () => void>>;

/**
 * Global keyboard shortcuts, keyed by KeyboardEvent.key (letters compared lower-case).
 * Ignored while typing in text fields/selects and when Ctrl/Cmd/Alt is held, so browser
 * shortcuts and the script editor are never hijacked.
 */
export function useShortcuts(map: ShortcutMap, enabled = true) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const keyOf = (e: KeyboardEvent) => (e.key.length === 1 ? (e.key === ' ' ? 'Space' : e.key.toLowerCase()) : e.key);

    const onDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (isTypingTarget(e.target)) return;
      const fn = ref.current[keyOf(e)];
      if (!fn) return;
      e.preventDefault(); // also stops Space/Enter from "clicking" a focused button
      if (!e.repeat || e.key.startsWith('Arrow')) fn();
    };
    // Space activates buttons on keyup in some browsers; swallow it when we own the key.
    const onUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isTypingTarget(e.target) && ref.current.Space) e.preventDefault();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [enabled]);
}
