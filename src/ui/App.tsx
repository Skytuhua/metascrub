import { useState } from 'react';
import { ShieldCheck, LockKeyhole, Layers, Sparkles, Eraser, Download, Trash2 } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dropzone } from './components/Dropzone';
import { ScrubControls, type PresetId } from './components/ScrubControls';
import { WorkItemCard } from './components/WorkItemCard';
import type { WorkItem } from './types';
import { fileToBytes, downloadBytes, uid } from './lib/files';
import { readMetadata } from '../core/read';
import { scrub, UnsupportedScrubError } from '../core/scrub';
import { createZip } from '../core/zip';
import { PRIVACY_PRESET, STRIP_ALL, type ScrubOptions } from '../core/types';

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [options, setOptions] = useState<ScrubOptions>(PRIVACY_PRESET);
  const [preset, setPreset] = useState<PresetId>('privacy');

  // Derived counts (computed during render — no effects needed).
  const scrubbable = items.filter((i) => i.status === 'ready' && i.report?.capability !== 'readonly');
  const doneItems = items.filter((i) => i.status === 'done' && i.result);
  const busy = items.some((i) => i.status === 'scrubbing' || i.status === 'reading');

  const patch = (id: string, p: Partial<WorkItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const addFiles = (files: File[]) => {
    const created: WorkItem[] = files.map((f) => ({
      id: uid(),
      file: f,
      name: f.name,
      size: f.size,
      status: 'reading',
      previewUrl: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...created]);
    created.forEach(async (it) => {
      try {
        const bytes = await fileToBytes(it.file);
        const report = await readMetadata(bytes, it.name);
        patch(it.id, { bytes, report, status: 'ready' });
      } catch {
        patch(it.id, { status: 'error', error: 'Could not read this file.' });
      }
    });
  };

  const choosePreset = (p: PresetId) => {
    setPreset(p);
    if (p === 'privacy') setOptions(PRIVACY_PRESET);
    else if (p === 'all') setOptions(STRIP_ALL);
  };

  const toggleOption = (key: keyof ScrubOptions) => {
    setOptions((o) => ({ ...o, [key]: !o[key] }));
    setPreset('custom');
  };

  const scrubOne = async (item: WorkItem) => {
    if (!item.bytes || item.report?.capability === 'readonly') return;
    patch(item.id, { status: 'scrubbing', error: undefined });
    try {
      const result = await scrub(item.bytes, item.name, options);
      const afterReport = await readMetadata(result.bytes, result.filename);
      patch(item.id, { status: 'done', result, afterReport });
    } catch (e) {
      const msg = e instanceof UnsupportedScrubError ? e.message : 'Scrubbing failed for this file.';
      patch(item.id, { status: 'error', error: msg });
    }
  };

  const scrubAll = async () => {
    const targets = items.filter((i) => i.status === 'ready' && i.report?.capability !== 'readonly');
    // Sequential on purpose: keeps memory/CPU sane for large HEIC decodes.
    for (const t of targets) {
      await scrubOne(t);
    }
  };

  const downloadOne = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (it?.result) downloadBytes(it.result.bytes, it.result.mime, it.result.filename);
  };

  const downloadAll = () => {
    if (!doneItems.length) return;
    const seen = new Map<string, number>();
    const entries = doneItems.map((i) => {
      let name = i.result!.filename;
      const n = seen.get(name) ?? 0;
      if (n > 0) {
        const dot = name.lastIndexOf('.');
        name = dot > 0 ? `${name.slice(0, dot)}-${n}${name.slice(dot)}` : `${name}-${n}`;
      }
      seen.set(i.result!.filename, n + 1);
      return { name, data: i.result!.bytes };
    });
    downloadBytes(createZip(entries), 'application/zip', 'metascrub-clean.zip');
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    setItems([]);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {items.length === 0 ? (
          <Hero onFiles={addFiles} />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Controls (first on mobile, sticky sidebar on desktop) */}
            <aside className="lg:order-2 lg:w-80 lg:shrink-0">
              <div className="lg:sticky lg:top-6 space-y-3">
                <ScrubControls options={options} preset={preset} onPreset={choosePreset} onToggle={toggleOption} />
                <div className="card flex flex-col gap-2 p-4">
                  <button type="button" onClick={scrubAll} disabled={scrubbable.length === 0 || busy} className="btn-accent">
                    <Eraser className="h-4 w-4" aria-hidden="true" />
                    Scrub all ({scrubbable.length})
                  </button>
                  <button type="button" onClick={downloadAll} disabled={doneItems.length === 0} className="btn-ghost">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download all (.zip) ({doneItems.length})
                  </button>
                  <button type="button" onClick={clearAll} className="btn-danger">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Clear all
                  </button>
                </div>
              </div>
            </aside>

            {/* Queue */}
            <div className="min-w-0 flex-1 lg:order-1">
              <Dropzone onFiles={addFiles} compact />
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <WorkItemCard key={item.id} item={item} onScrub={(id) => scrubOne(items.find((i) => i.id === id)!)} onDownload={downloadOne} onRemove={removeItem} />
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Hero({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-accent/10">
        <ShieldCheck className="h-9 w-9 text-accent" aria-hidden="true" />
      </div>
      <h1 className="text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        Strip hidden metadata from your images
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-fg">
        See and remove EXIF, GPS location and other hidden data baked into your photos —{' '}
        <span className="text-fg">100% in your browser</span>. Nothing is ever uploaded.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <span className="chip bg-accent/10 text-accent">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> No upload
        </span>
        <span className="chip bg-accent/10 text-accent">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Lossless
        </span>
        <span className="chip bg-accent/10 text-accent">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Batch
        </span>
      </div>

      <div className="mt-7">
        <Dropzone onFiles={onFiles} />
      </div>
    </section>
  );
}
