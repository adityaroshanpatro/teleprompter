import { useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../defaults';
import type { Settings } from '../types';
import { useLocalStorage } from './useLocalStorage';

const revive = (raw: unknown): Settings => {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...o, overlay: { ...DEFAULT_SETTINGS.overlay, ...(o.overlay ?? {}) } };
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('prompter.settings.v1', DEFAULT_SETTINGS, { revive });
  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    [setSettings],
  );
  /** Reset teleprompter/recording look & feel but keep chosen devices. */
  const reset = useCallback(
    () =>
      setSettings((s) => ({
        ...DEFAULT_SETTINGS,
        videoDeviceId: s.videoDeviceId,
        audioDeviceId: s.audioDeviceId,
      })),
    [setSettings],
  );
  return { settings, update, reset };
}
