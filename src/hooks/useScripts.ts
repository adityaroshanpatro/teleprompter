import { useCallback, useMemo } from 'react';
import { makeDemoScript } from '../defaults';
import type { Script } from '../types';
import { useLocalStorage } from './useLocalStorage';

interface Store {
  scripts: Script[];
  activeId: string;
}

const initialStore = (): Store => {
  const demo = makeDemoScript();
  return { scripts: [demo], activeId: demo.id };
};

const revive = (raw: unknown): Store => {
  const o = raw as Partial<Store> | null;
  if (!o || !Array.isArray(o.scripts) || o.scripts.length === 0) return initialStore();
  const scripts = o.scripts.filter(
    (s): s is Script => !!s && typeof s.id === 'string' && typeof s.body === 'string' && typeof s.title === 'string',
  );
  if (scripts.length === 0) return initialStore();
  const activeId = scripts.some((s) => s.id === o.activeId) ? (o.activeId as string) : scripts[0].id;
  return { scripts, activeId };
};

const blank = (title = 'Untitled script'): Script => {
  const now = Date.now();
  return { id: crypto.randomUUID(), title, body: '', createdAt: now, updatedAt: now, lastUsedAt: now };
};

/**
 * Script library kept in localStorage. Edits to the active script are saved as you type
 * (that's the "current script persists" behaviour); everything else is explicit.
 */
export function useScripts() {
  const [store, setStore] = useLocalStorage<Store>('prompter.scripts.v1', initialStore, { revive });

  const active = useMemo(
    () => store.scripts.find((s) => s.id === store.activeId) ?? store.scripts[0],
    [store],
  );
  const recent = useMemo(
    () => [...store.scripts].sort((a, b) => b.lastUsedAt - a.lastUsedAt),
    [store.scripts],
  );

  const patch = useCallback(
    (id: string, p: Partial<Pick<Script, 'title' | 'body'>>) =>
      setStore((s) => ({
        ...s,
        scripts: s.scripts.map((x) => (x.id === id ? { ...x, ...p, updatedAt: Date.now() } : x)),
      })),
    [setStore],
  );

  const select = useCallback(
    (id: string) =>
      setStore((s) =>
        s.scripts.some((x) => x.id === id)
          ? { activeId: id, scripts: s.scripts.map((x) => (x.id === id ? { ...x, lastUsedAt: Date.now() } : x)) }
          : s,
      ),
    [setStore],
  );

  const create = useCallback(
    (body = '', title?: string) => {
      const s = { ...blank(title), body };
      setStore((st) => ({ scripts: [...st.scripts, s], activeId: s.id }));
      return s.id;
    },
    [setStore],
  );

  const duplicate = useCallback(
    (id: string) =>
      setStore((st) => {
        const src = st.scripts.find((x) => x.id === id);
        if (!src) return st;
        const copy = { ...blank(`${src.title} (copy)`), body: src.body };
        return { scripts: [...st.scripts, copy], activeId: copy.id };
      }),
    [setStore],
  );

  const remove = useCallback(
    (id: string) =>
      setStore((st) => {
        let scripts = st.scripts.filter((x) => x.id !== id);
        if (scripts.length === 0) scripts = [blank()];
        const activeId = scripts.some((x) => x.id === st.activeId)
          ? st.activeId
          : [...scripts].sort((a, b) => b.lastUsedAt - a.lastUsedAt)[0].id;
        return { scripts, activeId };
      }),
    [setStore],
  );

  return { scripts: store.scripts, recent, active, patch, select, create, duplicate, remove };
}
