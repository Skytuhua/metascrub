import { ShieldCheck, Github, Sun, Moon, LockKeyhole } from 'lucide-react';
import { REPO_URL } from '../config';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: Props) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="./" className="flex items-center gap-2.5" aria-label="MetaScrub home">
          <ShieldCheck className="h-7 w-7 text-accent" aria-hidden="true" />
          <span className="font-heading text-lg font-bold tracking-tight">MetaScrub</span>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="chip hidden bg-accent/10 text-accent sm:inline-flex" title="All processing happens on your device">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Nothing is uploaded
          </span>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost h-9 w-9 !p-0"
            aria-label="View source on GitHub (opens in a new tab)"
            title="View source on GitHub"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-ghost h-9 w-9 !p-0"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
