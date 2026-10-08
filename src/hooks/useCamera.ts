import { useCallback, useEffect, useState } from 'react';
import { detectSupport } from '../utils/compat';
import { classifyMediaError, type CameraError } from '../utils/media';

export type CameraStatus = 'idle' | 'starting' | 'live' | 'error';
/** ok = mic is in the stream · off = user turned it off · denied/unavailable = camera-only fallback */
export type MicStatus = 'ok' | 'off' | 'denied' | 'unavailable';

export interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface Options {
  enabled: boolean;
  videoDeviceId: string;
  audioDeviceId: string; // '' default · 'off' none
  height: number;
  /** Called when a remembered device is gone and we fell back to the default one. */
  onDeviceFallback?: () => void;
}

const exact = (id: string) => (id && id !== 'off' ? { deviceId: { exact: id } } : {});

export function useCamera({ enabled, videoDeviceId, audioDeviceId, height, onDeviceFallback }: Options) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<CameraError | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatus>('ok');
  const [videos, setVideos] = useState<DeviceInfo[]>([]);
  const [audios, setAudios] = useState<DeviceInfo[]>([]);
  const [activeVideoId, setActiveVideoId] = useState('');
  const [activeAudioId, setActiveAudioId] = useState('');
  const [nonce, setNonce] = useState(0);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const label = (d: MediaDeviceInfo, i: number, kind: string) => d.label || `${kind} ${i + 1}`;
      setVideos(
        all.filter((d) => d.kind === 'videoinput').map((d, i) => ({ deviceId: d.deviceId, label: label(d, i, 'Camera') })),
      );
      setAudios(
        all.filter((d) => d.kind === 'audioinput').map((d, i) => ({ deviceId: d.deviceId, label: label(d, i, 'Microphone') })),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    md.addEventListener('devicechange', refreshDevices);
    return () => md.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => {
    setStream(null);
    if (!enabled) {
      setStatus('idle');
      setError(null);
      return;
    }
    const support = detectSupport();
    if (!support.mediaDevices) {
      setStatus('error');
      setError({ kind: support.secureContext ? 'unsupported' : 'insecure' });
      return;
    }

    let cancelled = false;
    let current: MediaStream | null = null;
    setStatus('starting');
    setError(null);

    const video = (id: string): MediaTrackConstraints => ({
      ...exact(id),
      width: { ideal: Math.round((height * 16) / 9) },
      height: { ideal: height },
      frameRate: { ideal: 30 },
    });
    const audio: (id: string) => MediaTrackConstraints = (id) => ({
      ...exact(id),
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
    const wantAudio = audioDeviceId !== 'off';

    // Most to least ambitious; the first one that works wins.
    const attempts: { vid: string; aud: boolean; audId: string }[] = [{ vid: videoDeviceId, aud: wantAudio, audId: audioDeviceId }];
    if (wantAudio) attempts.push({ vid: videoDeviceId, aud: false, audId: '' }); // camera only
    if (videoDeviceId) {
      attempts.push({ vid: '', aud: wantAudio, audId: '' }); // remembered camera is gone
      if (wantAudio) attempts.push({ vid: '', aud: false, audId: '' });
    }

    (async () => {
      let got: MediaStream | null = null;
      let usedAttempt: (typeof attempts)[number] | null = null;
      const errors: unknown[] = [];
      for (const a of attempts) {
        try {
          got = await navigator.mediaDevices.getUserMedia({
            video: video(a.vid),
            audio: a.aud ? audio(a.audId) : false,
          });
          usedAttempt = a;
          break;
        } catch (e) {
          errors.push(e);
        }
      }
      if (cancelled) {
        got?.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!got || !usedAttempt) {
        setStatus('error');
        setError(classifyMediaError(errors[errors.length - 1]));
        await refreshDevices();
        return;
      }
      current = got;
      const track = got.getVideoTracks()[0];
      track?.addEventListener('ended', () => {
        if (cancelled) return;
        setStream(null);
        setStatus('error');
        setError({ kind: 'disconnected' });
      });
      if (!wantAudio) setMicStatus('off');
      else if (usedAttempt.aud) setMicStatus('ok');
      else setMicStatus(classifyMediaError(errors[0]).kind === 'denied' ? 'denied' : 'unavailable');
      if (videoDeviceId && usedAttempt.vid === '') onDeviceFallback?.();

      setActiveVideoId(track?.getSettings().deviceId ?? '');
      setActiveAudioId(got.getAudioTracks()[0]?.getSettings().deviceId ?? '');
      setStream(got);
      setStatus('live');
      await refreshDevices();
    })();

    return () => {
      cancelled = true;
      current?.getTracks().forEach((t) => t.stop());
    };
    // onDeviceFallback is intentionally not a dependency (it would restart the camera).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, videoDeviceId, audioDeviceId, height, nonce, refreshDevices]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return { stream, status, error, micStatus, videos, audios, activeVideoId, activeAudioId, retry };
}

export type CameraApi = ReturnType<typeof useCamera>;
