/** True when the keyboard event target is somewhere the user is typing/choosing text or options. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type;
    // Sliders and checkboxes aren't "typing"; our shortcuts should still work after using them.
    return !['range', 'checkbox', 'radio', 'button', 'color'].includes(type);
  }
  return false;
}

export interface ShortcutDoc {
  keys: string[];
  action: string;
}

export const SHORTCUT_DOCS: ShortcutDoc[] = [
  { keys: ['Space'], action: 'Pause / resume the teleprompter' },
  { keys: ['R'], action: 'Restart the teleprompter from the top' },
  { keys: ['↑', '↓'], action: 'Increase / decrease scroll speed' },
  { keys: ['←', '→'], action: 'Scroll backward / forward' },
  { keys: ['Enter'], action: 'Start / stop recording (cancels a countdown)' },
  { keys: ['P'], action: 'Pause / resume the recording' },
  { keys: ['F'], action: 'Toggle fullscreen presenter mode' },
  { keys: ['Esc'], action: 'Exit fullscreen / cancel countdown' },
  { keys: ['?'], action: 'Show / hide this help' },
];
