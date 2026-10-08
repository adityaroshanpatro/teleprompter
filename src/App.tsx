import { useEffect, useState } from 'react';
import { Header, type View } from './components/Header';
import { RecordView } from './components/RecordView';
import { ScriptEditor } from './components/ScriptEditor';
import { useRecorder } from './hooks/useRecorder';
import { useScripts } from './hooks/useScripts';
import { useSettings } from './hooks/useSettings';
import { useShortcuts } from './hooks/useShortcuts';

export default function App() {
  const library = useScripts();
  const { settings, update, reset } = useSettings();
  const recorder = useRecorder(settings.quality);
  const [view, setView] = useState<View>('script');
  const [helpOpen, setHelpOpen] = useState(false);

  const busy = recorder.state !== 'idle';

  // A take only exists in memory until downloaded — don't let a reload throw it away silently.
  const unsaved = busy || (!!recorder.recording && !recorder.recording.downloaded);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  useShortcuts({
    '?': () => setHelpOpen((o) => !o),
    Escape: () => setHelpOpen(false),
  });

  return (
    <div className="min-h-screen">
      <Header view={view} onView={setView} navLocked={busy} helpOpen={helpOpen} onHelpOpen={setHelpOpen} />
      <main>
        {view === 'script' ? (
          <ScriptEditor
            library={library}
            wpm={settings.wpm}
            onWpmChange={(wpm) => update({ wpm })}
            onOpenTeleprompter={() => {
              library.select(library.active.id);
              setView('record');
            }}
          />
        ) : (
          <RecordView script={library.active} settings={settings} onChangeSettings={update} onResetSettings={reset} recorder={recorder} />
        )}
      </main>
    </div>
  );
}
