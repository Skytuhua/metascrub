import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { MetadataField, FieldGroup, MetadataReport } from '../../core/types';

const GROUP_LABELS: Record<FieldGroup, string> = {
  gps: 'Location (GPS)',
  device: 'Device identifiers',
  datetime: 'Date & time',
  software: 'Software',
  iptc: 'Author & caption (IPTC)',
  xmp: 'XMP metadata',
  thumbnail: 'Embedded thumbnail',
  camera: 'Camera & settings',
  orientation: 'Orientation',
  icc: 'Color profile',
  image: 'Image properties',
  other: 'Other',
};

const SENSITIVE_ORDER: FieldGroup[] = ['gps', 'device', 'datetime', 'software', 'iptc', 'xmp', 'thumbnail', 'camera'];
const TECHNICAL_ORDER: FieldGroup[] = ['orientation', 'icc', 'image', 'other'];

export function MetadataPanel({ report }: { report: MetadataReport }) {
  const [showTechnical, setShowTechnical] = useState(false);

  const byGroup = new Map<FieldGroup, MetadataField[]>();
  for (const f of report.fields) {
    const arr = byGroup.get(f.group) ?? [];
    arr.push(f);
    byGroup.set(f.group, arr);
  }

  const sensitiveGroups = SENSITIVE_ORDER.filter((g) => byGroup.has(g));
  const technicalGroups = TECHNICAL_ORDER.filter((g) => byGroup.has(g));

  return (
    <div className="space-y-3">
      {sensitiveGroups.map((g) => (
        <Group key={g} label={GROUP_LABELS[g]} fields={byGroup.get(g)!} sensitive />
      ))}

      {technicalGroups.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-fg hover:text-fg"
            aria-expanded={showTechnical}
          >
            {showTechnical ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {showTechnical ? 'Hide' : 'Show'} technical details ({technicalGroups.reduce((n, g) => n + byGroup.get(g)!.length, 0)})
          </button>
          {showTechnical && (
            <div className="mt-2 space-y-3">
              {technicalGroups.map((g) => (
                <Group key={g} label={GROUP_LABELS[g]} fields={byGroup.get(g)!} sensitive={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, fields, sensitive }: { label: string; fields: MetadataField[]; sensitive: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        {sensitive && <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />}
        <span className={sensitive ? 'text-warning' : 'text-muted-fg'}>{label}</span>
      </div>
      <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {fields.map((f) => (
          <div key={f.key} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 bg-muted/40 px-3 py-1.5 text-sm">
            <dt className="truncate text-muted-fg" title={f.label}>
              {f.label}
            </dt>
            <dd className="min-w-0">
              <span className="break-words font-mono text-xs text-fg">{f.value}</span>
              {f.note && <p className="mt-0.5 text-xs text-muted-fg">{f.note}</p>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
