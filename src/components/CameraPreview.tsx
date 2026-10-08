import { useEffect, useRef, type ReactNode } from 'react';
import type { CameraApi } from '../hooks/useCamera';
import { detectSupport } from '../utils/compat';
import { AlertIcon, CameraIcon } from './icons';
import { Button } from './ui';

interface Props {
  camera: CameraApi;
  mirror: boolean;
  fit: 'cover' | 'contain';
  enabled: boolean;
  onEnable: () => void;
}

/** The live <video>, plus a friendly state for every way getting a camera can go wrong. */
export function CameraPreview({ camera, mirror, fit, enabled, onEnable }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = camera.stream;
    if (camera.stream) void v.play().catch(() => undefined);
  }, [camera.stream]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        data-testid="camera-video"
        className="absolute inset-0 h-full w-full bg-black"
        style={{ objectFit: fit, transform: mirror ? 'scaleX(-1)' : undefined }}
      />
      {!camera.stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-6 text-center">
          <CameraMessage camera={camera} enabled={enabled} onEnable={onEnable} />
        </div>
      )}
    </>
  );
}

function CameraMessage({ camera, enabled, onEnable }: Pick<Props, 'camera' | 'enabled' | 'onEnable'>) {
  if (!enabled) {
    return (
      <Notice icon={<CameraIcon width={28} height={28} />} title="Camera is off">
        <p>Turn it on to preview yourself and record.</p>
        <Button variant="primary" onClick={onEnable}>
          Turn camera on
        </Button>
      </Notice>
    );
  }
  if (camera.status === 'starting' || camera.status === 'idle') {
    return (
      <Notice icon={<CameraIcon width={28} height={28} />} title="Starting camera…">
        <p>If your browser asks, choose “Allow” for both camera and microphone.</p>
      </Notice>
    );
  }
  const kind = camera.error?.kind ?? 'unknown';
  const retry = (
    <Button variant="primary" onClick={camera.retry}>
      Try again
    </Button>
  );
  switch (kind) {
    case 'denied':
      return (
        <Notice icon={<AlertIcon width={28} height={28} />} title="Camera access is blocked" tone="warn">
          <p>Prompter needs permission to use your camera. To enable it:</p>
          <ol className="list-decimal text-left pl-5 space-y-1">
            <li>Click the camera / lock icon in your browser’s address bar.</li>
            <li>Set <b>Camera</b> (and <b>Microphone</b>) to <b>Allow</b>.</li>
            <li>Come back here and press “Try again” (you may need to reload).</li>
          </ol>
          <p className="text-zinc-500">Also check your OS privacy settings (Windows: Settings → Privacy → Camera).</p>
          {retry}
        </Notice>
      );
    case 'no-camera':
      return (
        <Notice icon={<CameraIcon width={28} height={28} />} title="No camera found" tone="warn">
          <p>Plug in or enable a webcam, make sure another app isn’t blocking it, then try again.</p>
          {retry}
        </Notice>
      );
    case 'in-use':
      return (
        <Notice icon={<AlertIcon width={28} height={28} />} title="Camera is busy" tone="warn">
          <p>Another app or browser tab is using your camera. Close it (Zoom, Teams, OBS…) and try again.</p>
          {retry}
        </Notice>
      );
    case 'disconnected':
      return (
        <Notice icon={<AlertIcon width={28} height={28} />} title="Camera disconnected" tone="warn">
          <p>The camera stopped sending video. Reconnect it and try again.</p>
          {retry}
        </Notice>
      );
    case 'insecure':
      return (
        <Notice icon={<AlertIcon width={28} height={28} />} title="Camera needs a secure origin" tone="warn">
          <p>
            Browsers only allow camera access on <code>https://</code> or <code>http://localhost</code>
            {detectSupport().secureContext ? '' : ' — this page is neither'}. Open the app via{' '}
            <code>http://localhost:5173</code>.
          </p>
        </Notice>
      );
    case 'unsupported':
      return (
        <Notice icon={<AlertIcon width={28} height={28} />} title="Camera API not available" tone="warn">
          <p>This browser doesn’t support webcam access. Use a recent Chrome, Edge, Firefox or Safari.</p>
        </Notice>
      );
    default:
      return (
        <Notice icon={<AlertIcon width={28} height={28} />} title="Couldn’t start the camera" tone="warn">
          <p>{camera.error?.detail ?? 'An unexpected error occurred.'}</p>
          {retry}
        </Notice>
      );
  }
}

function Notice({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone?: 'warn';
  children: ReactNode;
}) {
  return (
    <div role="status" className="flex max-w-md flex-col items-center gap-3 text-sm text-zinc-300">
      <div className={tone === 'warn' ? 'text-amber-400' : 'text-sky-400'}>{icon}</div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {children}
    </div>
  );
}
