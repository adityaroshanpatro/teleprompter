import { useEffect, useRef } from 'react';
import type { Recording } from '../types';
import { downloadUrl, timestampName } from '../utils/media';
import { formatBytes, formatClock } from '../utils/text';
import { CloseIcon, DownloadIcon, RecordIcon, TrashIcon } from './icons';
import { Button, IconButton } from './ui';

interface Props {
  recording: Recording;
  onDownloaded: () => void;
  onDelete: () => void;
  onRecordAgain: () => void;
  onClose: () => void;
}

export function VideoPreview({ recording, onDownloaded, onDelete, onRecordAgain, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // MediaRecorder output has no duration header, so browsers report Infinity and block seeking.
  // Seeking far past the end forces the browser to compute the real duration; then rewind.
  const fixDuration = () => {
    const v = videoRef.current;
    if (!v || v.duration !== Infinity) return;
    const restore = () => {
      v.removeEventListener('timeupdate', restore);
      v.currentTime = 0;
    };
    v.addEventListener('timeupdate', restore);
    v.currentTime = 1e101;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filename = timestampName(recording.ext, new Date(recording.createdAt));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Recorded video">
      <div className="flex max-h-full w-full max-w-4xl flex-col gap-3 overflow-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your recording</h2>
          <IconButton label="Close preview" variant="ghost" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <video
          ref={videoRef}
          data-testid="result-video"
          src={recording.url}
          controls
          playsInline
          onLoadedMetadata={fixDuration}
          className="max-h-[60vh] w-full rounded-lg bg-black"
        />
        <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-zinc-300" data-testid="result-meta">
          <div>
            <dt className="inline text-zinc-500">Duration </dt>
            <dd className="inline tabular-nums">{formatClock(recording.durationMs)}</dd>
          </div>
          <div>
            <dt className="inline text-zinc-500">Size </dt>
            <dd className="inline">{formatBytes(recording.size)}</dd>
          </div>
          <div>
            <dt className="inline text-zinc-500">Format </dt>
            <dd className="inline">{recording.mimeType || recording.ext}</dd>
          </div>
        </dl>
        <p className="text-xs text-zinc-500">
          Stored only in this tab’s memory. Download it before closing or reloading the page — nothing is uploaded anywhere.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            data-testid="download-btn"
            onClick={() => {
              downloadUrl(recording.url, filename);
              onDownloaded();
            }}
          >
            <DownloadIcon /> Download .{recording.ext}
          </Button>
          <Button size="lg" onClick={onRecordAgain} data-testid="record-again-btn">
            <RecordIcon className="text-rose-400" /> Record again
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="ml-auto text-rose-300"
            data-testid="delete-btn"
            onClick={() => {
              if (recording.downloaded || window.confirm('Delete this recording? It has not been downloaded yet.')) onDelete();
            }}
          >
            <TrashIcon /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
