import { useCallback, useEffect, useRef, useState } from 'react';

interface Options<T> {
  /** Validate / migrate whatever was stored (e.g. merge in new default keys). */
  revive?: (raw: unknown) => T;
}

function read<T>(key: string, initial: () => T, revive?: (raw: unknown) => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      return revive ? revive(parsed) : (parsed as T);
    }
  } catch {
    /* storage unavailable or corrupt JSON — fall through to the default */
  }
  return initial();
}

/** useState that persists to localStorage. Never throws (private mode, quota, corrupt data). */
export function useLocalStorage<T>(
  key: string,
  initial: T | (() => T),
  options: Options<T> = {},
): [T, (value: T | ((prev: T) => T)) => void] {
  const initialRef = useRef(initial);
  const reviveRef = useRef(options.revive);
  const [value, setValue] = useState<T>(() =>
    read(
      key,
      () => (typeof initialRef.current === 'function' ? (initialRef.current as () => T)() : initialRef.current),
      reviveRef.current,
    ),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded or storage disabled — keep working in memory */
    }
  }, [key, value]);

  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), []);
  return [value, set];
}
