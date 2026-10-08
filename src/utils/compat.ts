export interface Support {
  secureContext: boolean;
  mediaDevices: boolean;
  mediaRecorder: boolean;
}

export function detectSupport(): Support {
  return {
    secureContext: typeof window !== 'undefined' && window.isSecureContext,
    mediaDevices:
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function',
    mediaRecorder: typeof MediaRecorder !== 'undefined',
  };
}

export interface RecordingFormat {
  mimeType: string;
  ext: 'webm' | 'mp4';
}

/** Best container/codec combination this browser can actually record, in order of preference. */
const CANDIDATES: RecordingFormat[] = [
  { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
  { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
  { mimeType: 'video/webm;codecs=h264,opus', ext: 'webm' },
  { mimeType: 'video/webm', ext: 'webm' },
  { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
  { mimeType: 'video/mp4', ext: 'mp4' },
];

export function pickRecordingFormat(): RecordingFormat | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const c of CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
    } catch {
      /* ignore */
    }
  }
  // Let the browser choose its own default.
  return { mimeType: '', ext: 'webm' };
}

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

export function currentFullscreenElement(): Element | null {
  const d = document as FsDoc;
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

export async function requestFullscreen(el: HTMLElement): Promise<boolean> {
  const e = el as FsEl;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (e.webkitRequestFullscreen) await e.webkitRequestFullscreen();
    else return false;
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  const d = document as FsDoc;
  try {
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    else if (d.webkitFullscreenElement && d.webkitExitFullscreen) await d.webkitExitFullscreen();
  } catch {
    /* ignore */
  }
}
