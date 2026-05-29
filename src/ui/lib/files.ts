/** Read a File into bytes, entirely in-memory (no upload). */
export async function fileToBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/** Trigger a local download of bytes — never touches the network. */
export function downloadBytes(bytes: Uint8Array, mime: string, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "1234567" -> "1.2 MB". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

let counter = 0;
/** A small unique id for list items. */
export function uid(): string {
  counter += 1;
  return `item-${Date.now().toString(36)}-${counter}`;
}
