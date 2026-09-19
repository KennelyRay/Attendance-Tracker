'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AmbientPageLoader } from '@/components/layout/AmbientPageLoader';
import {
  GLOBAL_NAVIGATION_END_EVENT,
  GLOBAL_NAVIGATION_START_EVENT,
  setNavigationLoaderActive,
  type NavigationLoaderDetail,
} from '@/components/layout/navigation-loader';

const MIN_OVERLAY_MS = 220;
const MAX_OVERLAY_MS = 10_000;

const defaultDetail: Required<NavigationLoaderDetail> = {
  title: 'Loading',
  description: 'Opening the next page.',
  minDurationMs: MIN_OVERLAY_MS,
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
  // Held in a ref because the hide path reads it from inside timers.
  const minDurationRef = useRef(MIN_OVERLAY_MS);

  const hide = useCallback(() => {
    setIsVisible(false);
    setNavigationLoaderActive(false);
    window.dispatchEvent(new Event(GLOBAL_NAVIGATION_END_EVENT));
  }, []);

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
        minDurationMs: nextDetail?.minDurationMs ?? MIN_OVERLAY_MS,
      });
      minDurationRef.current = nextDetail?.minDurationMs ?? MIN_OVERLAY_MS;
      setIsVisible(true);
      setNavigationLoaderActive(true);

      fallbackTimeoutRef.current = window.setTimeout(hide, MAX_OVERLAY_MS);
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
  }, [hide]);

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
    const remaining = Math.max(0, minDurationRef.current - elapsed);

    hideTimeoutRef.current = window.setTimeout(() => {
      hide();
      hideTimeoutRef.current = null;
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    }, remaining);
  }, [hide, isVisible, routeKey]);

  if (!isVisible) {
    return null;
  }

  return <AmbientPageLoader title={detail.title} description={detail.description} />;
}
