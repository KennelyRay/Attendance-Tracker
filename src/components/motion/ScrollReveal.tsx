'use client';

import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { panelGroup, panelItem, reveal } from '@/components/motion/motion-tokens';

/**
 * Reveals a section the first time it scrolls into view.
 *
 * Runs once. Re-animating every time a section re-enters turns reading into a
 * slideshow. Anything visible on first paint should not be wrapped in this, or it
 * starts invisible and flashes in after hydration.
 */
export function ScrollReveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div
      data-reveal=""
      variants={reveal}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/** A group whose children arrive in sequence as the group scrolls into view. */
export function ScrollRevealGroup({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div
      data-reveal=""
      variants={panelGroup}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function ScrollRevealItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div data-reveal="" variants={panelItem} className={className}>
      {children}
    </m.div>
  );
}

/**
 * Parallax for a page header: as the header scrolls away its content drifts down and
 * softens slightly, so the page reads as having depth rather than one flat sheet.
 *
 * MotionConfig's reducedMotion setting only governs animations, not styles bound to
 * scroll-driven values, so the preference is checked here explicitly.
 */
export function ParallaxHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 56]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.55]);

  return (
    <div ref={ref} className={className}>
      <m.div style={prefersReduced ? undefined : { y, opacity }}>{children}</m.div>
    </div>
  );
}
