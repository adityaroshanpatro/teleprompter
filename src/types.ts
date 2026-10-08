export type Align = 'left' | 'center' | 'right';
export type FontKey = 'sans' | 'serif' | 'mono' | 'humanist';
export type Quality = 'auto' | 'low' | 'medium' | 'high';
/** sync: scrolling starts/stops together with the recording. manual: you control scrolling yourself. */
export type ScrollMode = 'sync' | 'manual';

/** Position of the teleprompter panel inside the stage, in percent of stage size. */
export interface OverlayLayout {
  top: number;
  height: number;
}

export interface Settings {
  // teleprompter
  fontSize: number; // px, at a 1280px-wide stage (scales with the stage)
  fontFamily: FontKey;
  speed: number; // px/s at a 1280px-wide stage; fractional allowed
  lineHeight: number;
  textWidth: number; // % of the panel width
  align: Align;
  textColor: string;
  bgColor: string;
  bgOpacity: number; // 0..1
  mirrorText: boolean;
  showReadingLine: boolean;
  overlay: OverlayLayout;
  wpm: number;
  // camera
  videoDeviceId: string;
  audioDeviceId: string; // '' = default, 'off' = no microphone
  mirrorPreview: boolean;
  // recording
  scrollMode: ScrollMode;
  countdownEnabled: boolean;
  countdownSeconds: number;
  quality: Quality;
  // interface
  autoHideControls: boolean;
  hideDelaySeconds: number;
}

export interface Script {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
}

export interface Recording {
  blob: Blob;
  url: string;
  mimeType: string;
  ext: 'webm' | 'mp4';
  durationMs: number;
  size: number;
  createdAt: number;
  downloaded: boolean;
}
