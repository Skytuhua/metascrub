import { MousePointerClick, ScanSearch, Eraser, LockKeyhole } from 'lucide-react';
import { REPO_URL } from '../config';

const STEPS = [
  { icon: MousePointerClick, title: 'Drop a photo', body: 'It is read into memory in your browser. No upload, ever.' },
  { icon: ScanSearch, title: 'See what it leaks', body: 'Every hidden field is shown — GPS plotted on an offline grid.' },
  { icon: Eraser, title: 'Scrub & download', body: 'Remove it losslessly and save a clean copy back to your device.' },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border">
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">
                  {i + 1}. {s.title}
                </p>
                <p className="text-sm text-muted-fg">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 text-center text-sm text-muted-fg">
          <p className="flex items-center gap-1.5 text-fg">
            <LockKeyhole className="h-4 w-4 text-accent" aria-hidden="true" />
            Your photos never leave your device — there is no server to send them to.
          </p>
          <p>
            Open source ·{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
              View the code on GitHub
            </a>{' '}
            · MIT licensed
          </p>
        </div>
      </div>
    </footer>
  );
}
