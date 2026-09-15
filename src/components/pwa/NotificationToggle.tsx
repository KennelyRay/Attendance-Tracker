'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type ToggleState =
  | 'checking'
  | 'unsupported'
  | 'unavailable'
  | 'blocked'
  | 'off'
  | 'on'
  | 'working';

function uint8ArrayToUrlBase64(buffer: ArrayBuffer) {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

/**
 * Turns push notifications on or off for this device.
 *
 * Renders nothing where push cannot work at all - no service worker, no Push API, or
 * no VAPID key configured on the server - rather than offering a control that would
 * fail. On iOS the Push API only exists once the app is on the home screen, so this
 * appears there only after installing.
 */
export function NotificationToggle() {
  const [state, setState] = useState<ToggleState>('checking');
  const [message, setMessage] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let isStale = false;

    const check = async () => {
      if (
        !publicKey ||
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        if (!isStale) setState('unsupported');
        return;
      }

      if (Notification.permission === 'denied') {
        if (!isStale) setState('blocked');
        return;
      }

      try {
        // The server is the only side that knows whether it can actually send.
        const status = await fetch('/api/push/subscribe', { cache: 'no-store' })
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null);

        if (status && status.configured === false) {
          if (!isStale) setState('unavailable');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();

        if (!existing) {
          if (!isStale) setState('off');
          return;
        }

        // A subscription is bound to the VAPID key that created it. If that key has
        // since changed, the push service rejects every send, so the browser's
        // subscription is dead even though it still looks active. Drop it so the next
        // "Turn on" registers cleanly against the current key.
        const boundKey = existing.options?.applicationServerKey;
        const isBoundToCurrentKey = boundKey
          ? uint8ArrayToUrlBase64(boundKey) === publicKey
          : false;

        if (!isBoundToCurrentKey) {
          await existing.unsubscribe().catch(() => undefined);
          if (!isStale) setState('off');
          return;
        }

        // Valid locally but absent server-side (for example pruned after a key
        // change) - re-register it rather than silently going quiet.
        if (status && status.subscriptions === 0) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existing.toJSON()),
          }).catch(() => undefined);
        }

        if (!isStale) setState('on');
      } catch {
        if (!isStale) setState('unsupported');
      }
    };

    void check();
    return () => {
      isStale = true;
    };
  }, [publicKey]);

  const enable = useCallback(async () => {
    setMessage(null);
    setState('working');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey as string),
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        await subscription.unsubscribe();
        const data = await response.json().catch(() => ({}));
        setMessage(data?.error || 'Could not turn on notifications.');
        setState('off');
        return;
      }

      setState('on');
      setMessage('Notifications are on for this device.');
    } catch {
      setMessage('Could not turn on notifications.');
      setState('off');
    }
  }, [publicKey]);

  const disable = useCallback(async () => {
    setMessage(null);
    setState('working');

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => undefined);
        await subscription.unsubscribe();
      }

      setState('off');
      setMessage('Notifications are off for this device.');
    } catch {
      setMessage('Could not turn off notifications.');
      setState('on');
    }
  }, []);

  if (state === 'checking' || state === 'unsupported') {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3.5 ring-1 ring-inset ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100">Push notifications</div>
          <div className="mt-0.5 text-xs leading-5 text-slate-400">
            {state === 'unavailable'
              ? 'Notifications are not set up on the server yet. Contact your administrator.'
              : state === 'blocked'
              ? 'Blocked in your browser settings. Allow notifications for this site to turn them on.'
              : state === 'on'
                ? 'This device will be alerted about leave decisions and requests awaiting review.'
                : 'Get alerted about leave decisions and requests awaiting review.'}
          </div>
        </div>

        {state !== 'blocked' && state !== 'unavailable' ? (
          <Button
            variant={state === 'on' ? 'secondary' : 'primary'}
            size="sm"
            disabled={state === 'working'}
            onClick={() => void (state === 'on' ? disable() : enable())}
            className="shrink-0"
          >
            {state === 'working' ? 'Working…' : state === 'on' ? 'Turn off' : 'Turn on'}
          </Button>
        ) : null}
      </div>

      {message ? <div className="mt-2 text-xs text-sky-300">{message}</div> : null}
    </div>
  );
}
