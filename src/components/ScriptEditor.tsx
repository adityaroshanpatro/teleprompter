import { useEffect, useRef, useState } from 'react';
import type { useScripts } from '../hooks/useScripts';
import { relativeTime } from '../utils/text';
import { CheckIcon, CopyIcon, EraserIcon, PlayIcon, PlusIcon, TrashIcon } from './icons';
import { ScriptStats } from './ScriptStats';
import { Button, IconButton } from './ui';
import { countWords } from '../utils/text';

type Library = ReturnType<typeof useScripts>;

interface Props {
  library: Library;
  wpm: number;
  onWpmChange: (wpm: number) => void;
  onOpenTeleprompter: () => void;
}

export function ScriptEditor({ library, wpm, onWpmChange, onOpenTeleprompter }: Props) {
  const { active, recent } = library;
  const [savedFlash, setSavedFlash] = useState(false);
  const timer = useRef<number | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => void (timer.current !== null && window.clearTimeout(timer.current)), []);

  const flashSaved = () => {
    setSavedFlash(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const clear = () => {
    if (active.body && !window.confirm('Clear all text in this script?')) return;
    library.patch(active.id, { body: '' });
    areaRef.current?.focus();
  };

  const remove = () => {
    if (window.confirm(`Delete “${active.title}”? This can’t be undone.`)) library.remove(active.id);
  };

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-4 p-4 md:grid-cols-[260px_minmax(0,1fr)]">
      {/* library */}
      <aside className="flex min-w-0 flex-col gap-2 md:max-h-[calc(100vh-88px)]" aria-label="Saved scripts">
        <Button variant="primary" onClick={() => library.create()} data-testid="new-script">
          <PlusIcon /> New script
        </Button>
        <h2 className="mt-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent scripts</h2>
        <ul className="flex-1 space-y-1 overflow-y-auto" data-testid="script-list">
          {recent.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => library.select(s.id)}
                aria-current={s.id === active.id}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  s.id === active.id ? 'border-sky-500/60 bg-sky-500/10' : 'border-transparent hover:bg-zinc-900'
                }`}
              >
                <div className="truncate text-sm font-medium text-zinc-100">{s.title || 'Untitled'}</div>
                <div className="text-[11px] text-zinc-500">
                  {countWords(s.body).toLocaleString()} words · {relativeTime(s.lastUsedAt)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* editor */}
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Script name"
            data-testid="script-title"
            value={active.title}
            onChange={(e) => library.patch(active.id, { title: e.target.value })}
            placeholder="Script name"
            className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold outline-none hover:border-zinc-700 focus:border-sky-400 focus:bg-zinc-900"
          />
          <Button
            onClick={() => {
              library.select(active.id);
              flashSaved();
            }}
            data-testid="save-script"
            title="Scripts are saved automatically as you type; this also marks the script as recently used"
          >
            {savedFlash ? <CheckIcon className="text-emerald-400" /> : null} {savedFlash ? 'Saved' : 'Save'}
          </Button>
          <IconButton label="Duplicate script" onClick={() => library.duplicate(active.id)}>
            <CopyIcon />
          </IconButton>
          <IconButton label="Clear text" onClick={clear} data-testid="clear-script">
            <EraserIcon />
          </IconButton>
          <IconButton label="Delete script" onClick={remove} className="text-rose-300" data-testid="delete-script">
            <TrashIcon />
          </IconButton>
        </div>

        <textarea
          ref={areaRef}
          data-testid="script-body"
          aria-label="Script text"
          value={active.body}
          onChange={(e) => library.patch(active.id, { body: e.target.value })}
          placeholder="Paste or type your script here…"
          spellCheck
          className="min-h-[50vh] w-full flex-1 resize-y rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-lg leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-500/70 md:min-h-[calc(100vh-270px)]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <ScriptStats text={active.body} wpm={wpm} />
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              Pace
              <input
                type="number"
                aria-label="Words per minute"
                data-testid="wpm-input"
                min={60}
                max={260}
                value={wpm}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isFinite(n)) onWpmChange(Math.min(260, Math.max(60, Math.round(n))));
                }}
                className="w-16 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-zinc-100 outline-none focus:border-sky-400"
              />
              WPM
            </label>
          </div>
          <Button variant="primary" size="lg" onClick={onOpenTeleprompter} data-testid="open-record">
            <PlayIcon /> Open in teleprompter
          </Button>
        </div>
      </section>
    </div>
  );
}
