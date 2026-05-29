import { ShieldCheck, Eraser, SlidersHorizontal } from 'lucide-react';
import type { ScrubOptions } from '../../core/types';

export type PresetId = 'privacy' | 'all' | 'custom';

interface Props {
  options: ScrubOptions;
  preset: PresetId;
  onPreset: (p: PresetId) => void;
  onToggle: (key: keyof ScrubOptions) => void;
}

const TOGGLES: { key: keyof ScrubOptions; label: string; hint: string }[] = [
  { key: 'removeGps', label: 'Location (GPS)', hint: 'Where the photo was taken' },
  { key: 'removeDevice', label: 'Device IDs', hint: 'Serial numbers, owner, unique IDs' },
  { key: 'removeDateTime', label: 'Date & time', hint: 'When the photo was taken' },
  { key: 'removeSoftware', label: 'Software', hint: 'App/device fingerprint & comments' },
  { key: 'removeCamera', label: 'Camera & settings', hint: 'Make, model, exposure' },
  { key: 'removeIptc', label: 'Author & caption', hint: 'IPTC byline, copyright, keywords' },
  { key: 'removeXmp', label: 'XMP metadata', hint: 'Editing history & identifiers' },
  { key: 'removeThumbnail', label: 'Embedded thumbnail', hint: 'Hidden preview of the original' },
  { key: 'removeIcc', label: 'Color profile (ICC)', hint: 'Off by default — affects colour' },
  { key: 'removeOrientation', label: 'Orientation', hint: 'Off by default — may rotate photo' },
];

export function ScrubControls({ options, preset, onPreset, onToggle }: Props) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden="true" />
        <h2 className="font-heading text-sm font-semibold">What to remove</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPreset('privacy')}
          aria-pressed={preset === 'privacy'}
          className={preset === 'privacy' ? 'btn-accent' : 'btn-ghost'}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Privacy preset
        </button>
        <button
          type="button"
          onClick={() => onPreset('all')}
          aria-pressed={preset === 'all'}
          className={preset === 'all' ? 'btn-accent' : 'btn-ghost'}
        >
          <Eraser className="h-4 w-4" aria-hidden="true" />
          Remove everything
        </button>
      </div>

      <fieldset>
        <legend className="sr-only">Choose which metadata groups to remove</legend>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <li key={t.key}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md p-2 hover:bg-muted">
                <input
                  type="checkbox"
                  checked={options[t.key]}
                  onChange={() => onToggle(t.key)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{t.label}</span>
                  <span className="block text-xs text-muted-fg">{t.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {preset === 'custom' && <p className="mt-2 text-xs text-muted-fg">Custom selection</p>}
    </div>
  );
}
