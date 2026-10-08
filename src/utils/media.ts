import type { Quality } from '../types';

export interface QualityProfile {
  height: number;
  bitrate?: number; // bits per second; undefined = browser default
  label: string;
}

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  auto: { height: 1080, label: 'Auto (1080p, browser default bitrate)' },
  low: { height: 720, bitrate: 2_500_000, label: 'Low — 720p, 2.5 Mbps' },
  medium: { height: 1080, bitrate: 5_000_000, label: 'Medium — 1080p, 5 Mbps' },
  high: { height: 1080, bitrate: 10_000_000, label: 'High — 1080p, 10 Mbps' },
};

export type CameraErrorKind =
  | 'denied'
  | 'no-camera'
  | 'in-use'
  | 'insecure'
  | 'unsupported'
  | 'disconnected'
  | 'unknown';

export interface CameraError {
  kind: CameraErrorKind;
  detail?: string;
}

export function classifyMediaError(err: unknown): CameraError {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  const detail = err instanceof Error ? err.message : undefined;
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return { kind: 'denied', detail };
    case 'NotFoundError':
    case 'OverconstrainedError':
    case 'DevicesNotFoundError':
      return { kind: 'no-camera', detail };
    case 'NotReadableError':
    case 'AbortError':
    case 'TrackStartError':
      return { kind: 'in-use', detail };
    default:
      return { kind: 'unknown', detail };
  }
}

export function timestampName(ext: string, now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `recording-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}.${ext}`;
}

export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
