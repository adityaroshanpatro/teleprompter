import { Button } from './ui';

export function Countdown({ value, onCancel }: { value: number; onCancel: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-[2px]"
    >
      <div className="text-sm uppercase tracking-[0.3em] text-white/70">Recording starts in</div>
      {/* key forces the pop animation to replay on every tick */}
      <div key={value} data-testid="countdown-value" className="animate-pop text-[min(26vw,18rem)] font-bold leading-none text-white">
        {value}
      </div>
      <Button variant="ghost" onClick={onCancel} className="text-white/80">
        Cancel (Enter)
      </Button>
    </div>
  );
}
