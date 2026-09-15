'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Offers to install the app, but only where the browser says that is possible.
 *
 * Renders nothing until `beforeinstallprompt` fires, so it is invisible in Safari,
 * in Firefox, and in an already-installed window. Nothing about the existing layout
 * changes when it is absent.
 */
export function InstallAppButton({ className = '' }: { className?: string }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Keep the browser's own mini-infobar from appearing so the prompt happens
      // when the user asks for it rather than mid-task.
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setInstallEvent(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const onInstall = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void onInstall()}
      className={['shrink-0', className].join(' ')}
      title="Install HRIS as an app"
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
        <path
          d="M10 3.5v8m0 0 3-3m-3 3-3-3M4.5 13.5v1a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Install app</span>
    </Button>
  );
}
