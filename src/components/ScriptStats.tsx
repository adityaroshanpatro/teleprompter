import { countWords, formatEstimate, formatSeconds } from '../utils/text';

interface Props {
  text: string;
  wpm: number;
  progress?: number;
  className?: string;
}

const nf = new Intl.NumberFormat();

export function ScriptStats({ text, wpm, progress, className = '' }: Props) {
  const words = countWords(text);
  const totalSec = wpm > 0 ? Math.round((words / wpm) * 60) : 0;
  const remainingSec = progress === undefined ? undefined : Math.round(totalSec * (1 - progress));
  return (
    <div data-testid="stats" className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 tabular-nums ${className}`}>
      <span>
        <b className="text-zinc-200">{nf.format(words)}</b> words · {formatEstimate(words, wpm)}
      </span>
      <span>{nf.format(text.length)} characters</span>
      {progress !== undefined && (
        <span>
          Progress <b className="text-zinc-200">{Math.round(progress * 100)}%</b> · ~{formatSeconds(remainingSec ?? 0)} remaining
        </span>
      )}
      <span className="text-zinc-500">at {wpm} WPM</span>
    </div>
  );
}
