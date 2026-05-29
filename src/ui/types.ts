import type { MetadataReport, ScrubResult } from '../core/types';

export type WorkStatus = 'reading' | 'ready' | 'scrubbing' | 'done' | 'error';

/** One image in the working queue. */
export interface WorkItem {
  id: string;
  file: File;
  name: string;
  size: number;
  bytes?: Uint8Array;
  /** Object URL of the original file, for the thumbnail preview (local only). */
  previewUrl?: string;
  status: WorkStatus;
  report?: MetadataReport;
  result?: ScrubResult;
  /** Metadata re-read from the cleaned output, to prove it's empty. */
  afterReport?: MetadataReport;
  error?: string;
}
