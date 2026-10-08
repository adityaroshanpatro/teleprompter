import { useState, type ReactNode } from 'react';
import { FileTextIcon, KeyboardIcon, LockIcon, VideoIcon } from './icons';
import { ShortcutsHelp } from './ShortcutsHelp';
import { IconButton } from './ui';

export type View = 'script' | 'record';

interface Props {
  view: View;
  onView: (v: View) => void;
  navLocked: boolean;
  helpOpen: boolean;
  onHelpOpen: (open: boolean) => void;
}

export function Header({ view, onView, navLocked, helpOpen, onHelpOpen }: Props) {
  const [tipOpen, setTipOpen] = useState(false);
  const tab = (v: View, label: string, icon: ReactNode) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === v}
      disabled={navLocked && view !== v}
      data-testid={`tab-${v}`}
      onClick={() => onView(v)}
      className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
        view === v ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-100'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 py-2.5 backdrop-blur">
      <button
        type="button"
        data-testid="home-btn"
        onClick={() => onView('script')}
        disabled={navLocked}
        title={navLocked ? 'Stop recording to go home' : 'Home'}
        className="flex items-center gap-2 rounded-lg font-semibold tracking-tight hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500 text-zinc-950">
          <FileTextIcon width={16} height={16} />
        </span>
        Prompter
      </button>

      <nav role="tablist" aria-label="Views" className="flex gap-1 rounded-xl bg-zinc-900 p-1">
        {tab('script', 'Script', <FileTextIcon width={16} height={16} />)}
        {tab('record', 'Record', <VideoIcon width={16} height={16} />)}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            data-testid="privacy-badge"
            onClick={() => setTipOpen((o) => !o)}
            onBlur={() => setTipOpen(false)}
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
            aria-describedby="privacy-tip"
          >
            <LockIcon width={13} height={13} /> Local / Private
          </button>
          {tipOpen && (
            <div id="privacy-tip" role="tooltip" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-300 shadow-2xl">
              Your script, settings, camera, microphone and recordings stay in this browser on this computer. There is no server, account or upload.
            </div>
          )}
        </div>
        <div className="relative">
          <IconButton label="Keyboard shortcuts (?)" variant="ghost" onClick={() => onHelpOpen(!helpOpen)} active={helpOpen} data-testid="help-btn">
            <KeyboardIcon />
          </IconButton>
          {helpOpen && <ShortcutsHelp onClose={() => onHelpOpen(false)} />}
        </div>
      </div>
    </header>
  );
}

