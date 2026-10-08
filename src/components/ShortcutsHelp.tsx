import { SHORTCUT_DOCS } from '../utils/keyboard';
import { CloseIcon } from './icons';
import { IconButton, Kbd } from './ui';

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      data-testid="shortcuts-help"
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
        <IconButton label="Close" variant="ghost" size="sm" onClick={onClose}>
          <CloseIcon width={16} height={16} />
        </IconButton>
      </div>
      <ul className="space-y-2">
        {SHORTCUT_DOCS.map((s) => (
          <li key={s.action} className="flex items-center justify-between gap-3 text-xs text-zinc-300">
            <span>{s.action}</span>
            <span className="flex shrink-0 gap-1">
              {s.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-zinc-500">Shortcuts work on the Record tab and pause while you type in a text box.</p>
    </div>
  );
}
