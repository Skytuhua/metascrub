import { useState } from 'react';
import { MapPin, Copy, Check, ExternalLink } from 'lucide-react';
import type { GpsPosition } from '../../core/types';
import { projectEquirectangular, formatCoord, osmUrl } from '../../core/gps';

const W = 360;
const H = 180;

/**
 * A fully-offline location preview. It plots the photo's coordinates on a
 * graticule grid — no map tiles are ever requested. The precise map opens only
 * if the user explicitly clicks the OpenStreetMap link.
 */
export function GpsMap({ pos }: { pos: GpsPosition }) {
  const [copied, setCopied] = useState(false);
  const pin = projectEquirectangular(pos, W, H);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCoord(pos));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  };

  const lons = [];
  for (let lng = -150; lng <= 150; lng += 30) lons.push(lng);
  const lats = [];
  for (let lat = -60; lat <= 60; lat += 30) lats.push(lat);

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        Location is embedded in this photo
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded bg-muted"
        role="img"
        aria-label={`Approximate location on a coordinate grid: ${formatCoord(pos)}`}
      >
        {/* graticule */}
        {lons.map((lng) => {
          const x = lng + 180;
          return <line key={`x${lng}`} x1={x} y1={0} x2={x} y2={H} stroke="var(--color-border)" strokeWidth={lng === 0 ? 1 : 0.5} />;
        })}
        {lats.map((lat) => {
          const y = 90 - lat;
          return <line key={`y${lat}`} x1={0} y1={y} x2={W} y2={y} stroke="var(--color-border)" strokeWidth={lat === 0 ? 1 : 0.5} />;
        })}
        {/* pin */}
        <circle cx={pin.x} cy={pin.y} r={9} fill="none" stroke="var(--color-destructive)" strokeWidth={1} opacity={0.5} className="ms-ping" />
        <circle cx={pin.x} cy={pin.y} r={4} fill="var(--color-destructive)" stroke="#fff" strokeWidth={1} />
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-fg">{formatCoord(pos)}</code>
        <button type="button" onClick={copy} className="btn-ghost h-7 px-2 text-xs" aria-label="Copy coordinates">
          {copied ? <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a
          href={osmUrl(pos)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost h-7 px-2 text-xs"
          title="Opens OpenStreetMap in a new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open precise map
        </a>
      </div>
      <p className="mt-1.5 text-xs text-muted-fg">Grid shown offline — the precise map only loads if you click the link above.</p>
    </div>
  );
}
