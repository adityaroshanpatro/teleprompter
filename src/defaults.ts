import type { Script, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 52,
  fontFamily: 'sans',
  speed: 22,
  lineHeight: 1.5,
  textWidth: 86,
  align: 'center',
  textColor: '#ffffff',
  bgColor: '#000000',
  bgOpacity: 0.62,
  mirrorText: false,
  showReadingLine: true,
  overlay: { top: 6, height: 40 },
  wpm: 150,
  videoDeviceId: '',
  audioDeviceId: '',
  mirrorPreview: true,
  scrollMode: 'sync',
  countdownEnabled: true,
  countdownSeconds: 3,
  quality: 'auto',
  autoHideControls: true,
  hideDelaySeconds: 3,
};

export const FONT_STACKS: Record<Settings['fontFamily'], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  humanist: '"Trebuchet MS", Verdana, Tahoma, "Gill Sans", sans-serif',
};

export const FONT_LABELS: Record<Settings['fontFamily'], string> = {
  sans: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
  humanist: 'Humanist (high legibility)',
};

export const DEMO_TITLE = 'Welcome — example script';

export const DEMO_SCRIPT = `Welcome to Prompter.

This is an example script, so you can see how everything works. Replace it with your own: open the Script tab, select all, and paste what you want to read.

Here is how a recording session goes. First, switch to the Record tab and allow camera and microphone access. Your picture appears behind the text, and the text sits right under your camera so your eyes barely move while you read.

Press Enter to begin. A short countdown runs, then recording starts and the script begins to scroll at the speed you choose. Use the Up and Down arrow keys to speed up or slow down, and Space to pause or resume the scrolling whenever you need a breath.

Everything here happens on your own computer. Your script, your settings and your video never leave this machine. When you stop, you can watch the take straight away and download it as a video file.

Read at a natural pace, keep your eyes near the lens, and smile. That's all there is to it.

Good luck with your recording!`;

export function makeDemoScript(now = Date.now()): Script {
  return {
    id: crypto.randomUUID(),
    title: DEMO_TITLE,
    body: DEMO_SCRIPT,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
  };
}
