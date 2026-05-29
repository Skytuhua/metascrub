import { useState } from 'react';
import {
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eraser,
  ChevronDown,
  ChevronRight,
  ImageOff,
  FileWarning,
} from 'lucide-react';
import type { WorkItem } from '../types';
import { formatBytes } from '../lib/files';
import { MetadataPanel } from './MetadataPanel';
import { GpsMap } from './GpsMap';

interface Props {
  item: WorkItem;
  onScrub: (id: string) => void;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
}

export function WorkItemCard({ item, onScrub, onDownload, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const r = item.report;
  const sensitiveCount = r ? r.fields.filter((f) => f.sensitive).length : 0;
  const canExpand = item.status !== 'reading' && !!r && r.hasMetadata;

  return (
    <li className="card overflow-hidden">
      <div className="flex items-start gap-3 p-3 sm:p-4">
        {/* Thumbnail */}
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
          {item.previewUrl && !imgError ? (
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-fg" aria-hidden="true" />
          )}
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium" title={item.name}>
                {item.name}
              </p>
              <p className="text-xs text-muted-fg">
                {r ? `${r.format.toUpperCase()} · ` : ''}
                {formatBytes(item.size)}
                {r?.width ? ` · ${r.width}×${r.height}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="btn-ghost h-8 w-8 shrink-0 !p-0"
              aria-label={`Remove ${item.name}`}
              title="Remove"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <StatusLine item={item} sensitiveCount={sensitiveCount} />

          {/* Actions */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {item.status === 'ready' && r?.capability !== 'readonly' && (
              <button type="button" onClick={() => onScrub(item.id)} className="btn-accent h-9">
                {r?.hasMetadata ? <Eraser className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                {r?.hasMetadata ? 'Scrub metadata' : 'Save a clean copy'}
              </button>
            )}
            {item.status === 'done' && (
              <button type="button" onClick={() => onDownload(item.id)} className="btn-accent h-9">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </button>
            )}
            {canExpand && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="btn-ghost h-9"
                aria-expanded={expanded}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {expanded ? 'Hide' : 'View'} metadata
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded metadata */}
      {expanded && r && (
        <div className="space-y-3 border-t border-border bg-muted/30 p-3 sm:p-4">
          {r.gps && <GpsMap pos={r.gps} />}
          <MetadataPanel report={r} />
        </div>
      )}
    </li>
  );
}

function StatusLine({ item, sensitiveCount }: { item: WorkItem; sensitiveCount: number }) {
  const r = item.report;

  if (item.status === 'reading') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-fg">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reading metadata…
      </p>
    );
  }
  if (item.status === 'scrubbing') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-fg">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Scrubbing…
      </p>
    );
  }
  if (item.status === 'error') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" /> {item.error ?? 'Something went wrong'}
      </p>
    );
  }
  if (item.status === 'done') {
    const before = item.report?.fields.length ?? 0;
    const after = item.afterReport?.fields.length ?? 0;
    const stillClean = !item.afterReport?.hasSensitive;
    return (
      <div className="mt-1.5 space-y-0.5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Cleaned{stillClean ? ' — no sensitive metadata remains' : ''}
        </p>
        <p className="text-xs text-muted-fg">
          {before} field{before === 1 ? '' : 's'} → {after} · {formatBytes(item.size)} → {formatBytes(item.result?.bytes.length ?? 0)}
          {item.result?.formatChanged ? ` · converted to ${item.result.mime.replace('image/', '').toUpperCase()}` : ''}
        </p>
      </div>
    );
  }
  // ready
  if (r?.capability === 'readonly') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-fg">
        <FileWarning className="h-4 w-4 text-warning" aria-hidden="true" />
        Viewing only — {r.format.toUpperCase()} can't be scrubbed in the browser
      </p>
    );
  }
  if (!r?.hasMetadata) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-accent">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" /> No metadata found — already clean
      </p>
    );
  }
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {r.gps && (
        <span className="chip bg-destructive/15 text-destructive">Location</span>
      )}
      <span className="chip bg-warning/15 text-warning">
        {sensitiveCount} sensitive field{sensitiveCount === 1 ? '' : 's'}
      </span>
      {r.capability === 'reencode' && (
        <span className="chip bg-muted text-muted-fg">re-encode → clean copy</span>
      )}
    </div>
  );
}
