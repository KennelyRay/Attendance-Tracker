'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AmbientPageLoader } from '@/components/layout/AmbientPageLoader';
import {
  GLOBAL_NAVIGATION_START_EVENT,
  type NavigationLoaderDetail,
} from '@/components/layout/navigation-loader';

const MIN_OVERLAY_MS = 220;
const MAX_OVERLAY_MS = 10_000;

const defaultDetail: Required<NavigationLoaderDetail> = {
  title: 'Loading page',
  description: 'Bringing the next view into focus.',
};

export function NavigationTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams]
  );
  const previousRouteKeyRef = useRef(routeKey);
  const startedAtRef = useRef(0);
  const hideTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [detail, setDetail] = useState<Required<NavigationLoaderDetail>>(defaultDetail);

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };

    const startOverlay = (nextDetail?: NavigationLoaderDetail) => {
      clearTimers();
      startedAtRef.current = Date.now();
      setDetail({
        title: nextDetail?.title || defaultDetail.title,
        description: nextDetail?.description || defaultDetail.description,
      });
      setIsVisible(true);

      fallbackTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, MAX_OVERLAY_MS);
    };

    const handleStart = (event: Event) => {
      const customEvent = event as CustomEvent<NavigationLoaderDetail>;
      startOverlay(customEvent.detail);
    };

    const handlePopState = () => {
      startOverlay();
    };

    window.addEventListener(GLOBAL_NAVIGATION_START_EVENT, handleStart as EventListener);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimers();
      window.removeEventListener(GLOBAL_NAVIGATION_START_EVENT, handleStart as EventListener);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) {
      return;
    }

    previousRouteKeyRef.current = routeKey;

    if (!isVisible) {
      return;
    }

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_OVERLAY_MS - elapsed);

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      hideTimeoutRef.current = null;
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    }, remaining);
  }, [isVisible, routeKey]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="app-overlay-scroll z-[80] bg-slate-950/72 px-3 py-5 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="app-overlay-panel max-w-xl">
        <AmbientPageLoader title={detail.title} description={detail.description} />
      </div>
    </div>
  );
}
