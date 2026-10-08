import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Quality, Recording } from '../types';
import { pickRecordingFormat } from '../utils/compat';
import { QUALITY_PROFILES } from '../utils/media';

export type RecorderState = 'idle' | 'recording' | 'paused';

/**
 * Wraps MediaRecorder. Pause/resume use MediaRecorder's native pause()/resume(), which freezes
 * the output timeline (paused time is not in the file). The elapsed timer mirrors that.
 */
export function useRecorder(quality: Quality) {
  const format = useMemo(() => pickRecordingFormat(), []);
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const urlRef = useRef<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const currentElapsed = () => accumulatedRef.current + (segmentStartRef.current ? performance.now() - segmentStartRef.current : 0);

  const revoke = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  const finalize = useCallback(
    (mimeType: string) => {
      clearTimer();
      const durationMs = accumulatedRef.current;
      const chunks = chunksRef.current;
      chunksRef.current = [];
      recorderRef.current = null;
      if (!mountedRef.current) return;
      setState('idle');
      setElapsedMs(durationMs);
      const blob = new Blob(chunks, { type: mimeType || format?.mimeType || 'video/webm' });
      if (blob.size === 0) {
        setError('The recording came out empty. Please try again.');
        return;
      }
      revoke();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const type = blob.type || mimeType;
      setRecording({
        blob,
        url,
        mimeType: type,
        ext: type.includes('mp4') ? 'mp4' : 'webm',
        durationMs,
        size: blob.size,
        createdAt: Date.now(),
        downloaded: false,
      });
    },
    [format],
  );

  const start = useCallback(
    (stream: MediaStream): boolean => {
      if (!format || typeof MediaRecorder === 'undefined') {
        setError('MediaRecorder is not supported in this browser.');
        return false;
      }
      if (recorderRef.current) return false;
      setError(null);
      const bitrate = QUALITY_PROFILES[quality].bitrate;
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream, {
          ...(format.mimeType ? { mimeType: format.mimeType } : {}),
          ...(bitrate ? { videoBitsPerSecond: bitrate } : {}),
        });
      } catch {
        try {
          rec = new MediaRecorder(stream);
        } catch (e) {
          setError(`Could not start recording: ${e instanceof Error ? e.message : String(e)}`);
          return false;
        }
      }
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onerror = () => {
        if (mountedRef.current) setError('The browser reported a recording error. What was captured so far has been kept.');
      };
      rec.onstop = () => {
        // Also fires if the camera is unplugged mid-recording: we keep what we have.
        if (segmentStartRef.current) {
          accumulatedRef.current += performance.now() - segmentStartRef.current;
          segmentStartRef.current = 0;
        }
        finalize(rec.mimeType);
      };
      try {
        rec.start(1000); // timeslice: flush data every second so little is lost on a crash
      } catch (e) {
        setError(`Could not start recording: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      }
      recorderRef.current = rec;
      accumulatedRef.current = 0;
      segmentStartRef.current = performance.now();
      setElapsedMs(0);
      setState('recording');
      clearTimer();
      timerRef.current = window.setInterval(() => setElapsedMs(currentElapsed()), 200);
      return true;
    },
    [format, quality, finalize],
  );

  const pause = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== 'recording') return;
    rec.pause();
    accumulatedRef.current += performance.now() - segmentStartRef.current;
    segmentStartRef.current = 0;
    setElapsedMs(accumulatedRef.current);
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== 'paused') return;
    rec.resume();
    segmentStartRef.current = performance.now();
    setState('recording');
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    rec.stop(); // onstop → finalize
  }, []);

  const discard = useCallback(() => {
    revoke();
    setRecording(null);
    setElapsedMs(0);
  }, []);

  const markDownloaded = useCallback(() => setRecording((r) => (r ? { ...r, downloaded: true } : r)), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.onstop = null;
        rec.stop();
      }
      revoke();
    };
  }, []);

  return {
    supported: !!format,
    format,
    state,
    elapsedMs,
    recording,
    error,
    start,
    pause,
    resume,
    stop,
    discard,
    markDownloaded,
    clearError,
  };
}

export type RecorderApi = ReturnType<typeof useRecorder>;
