import { useCallback, useRef, useState } from 'react';
import { UploadCloud, ImagePlus } from 'lucide-react';

interface Props {
  onFiles: (files: File[]) => void;
  /** Compact variant for the active workspace ("add more"). */
  compact?: boolean;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/tiff,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.avif,.heic,.heif';

export function Dropzone({ onFiles, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = useCallback((list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|tiff?|avif|heic|heif)$/i.test(f.name));
    if (files.length) onFiles(files);
  }, [onFiles]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setOver(false);
      pick(e.dataTransfer.files);
    },
    [pick],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add images: drag and drop, or activate to browse. Files stay on your device."
      onClick={() => inputRef.current?.click()}
      onKeyDown={onKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={[
        'group flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors duration-150',
        compact ? 'gap-2 p-5' : 'gap-3 p-10 sm:p-14',
        over ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-accent/60 hover:bg-muted',
      ].join(' ')}
    >
      {compact ? (
        <ImagePlus className="h-6 w-6 text-accent" aria-hidden="true" />
      ) : (
        <UploadCloud className={['h-12 w-12 transition-transform duration-150', over ? 'text-accent scale-110' : 'text-muted-fg group-hover:text-accent'].join(' ')} aria-hidden="true" />
      )}
      <div>
        <p className={compact ? 'font-medium' : 'text-lg font-semibold'}>
          {compact ? 'Add more images' : 'Drop images here'}
        </p>
        {!compact && (
          <p className="mt-1 text-sm text-muted-fg">
            or <span className="text-accent underline underline-offset-2">browse your device</span> · JPEG, PNG, WebP, GIF, HEIC, AVIF
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
