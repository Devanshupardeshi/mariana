'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { useExperience } from '@/lib/store';
import { ThinArrow } from '@/components/ui/icons';

interface MagneticButtonProps {
  label: string;
  href: string;
}

const RADIUS = 120; // px — the pull begins inside this distance
const STRENGTH = 0.34;

/**
 * The single call to action. A thin, editorial outline button — no neon pill,
 * no gradient. Within a 120px radius it eases toward the cursor (the label and
 * arrow drift a little further for parallax depth); beyond it, it springs back.
 * Magnetism is disabled under reduced motion, where it is a plain static button.
 */
export default function MagneticButton({ label, href }: MagneticButtonProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const btn = buttonRef.current;
    const content = contentRef.current;
    if (!btn || !content) return;

    const moveBtn = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const moveBtnY = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    const moveContent = gsap.quickTo(content, 'x', { duration: 0.6, ease: 'power3.out' });
    const moveContentY = gsap.quickTo(content, 'y', { duration: 0.6, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < RADIUS + Math.max(rect.width, rect.height) / 2) {
        moveBtn(dx * STRENGTH);
        moveBtnY(dy * STRENGTH);
        moveContent(dx * STRENGTH * 0.4);
        moveContentY(dy * STRENGTH * 0.4);
      } else {
        moveBtn(0);
        moveBtnY(0);
        moveContent(0);
        moveContentY(0);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reducedMotion]);

  return (
    <a
      ref={buttonRef}
      href={href}
      className="group pointer-events-auto relative inline-flex items-center gap-5 rounded-full border border-white/25 px-9 py-4 text-white/85 outline-none transition-colors duration-300 ease-out-expo hover:border-hydrothermal/80 focus-visible:border-hydrothermal active:scale-[0.98]"
    >
      <span ref={contentRef} className="flex items-center gap-5">
        <span className="font-mono text-[12px] uppercase tracking-telemetry">{label}</span>
        <ThinArrow className="h-3 w-9 text-white/55 transition-all duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-hydrothermal" />
      </span>
      {/* A whisper of warmth pooling behind the label on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: '0 0 50px -8px rgba(212,175,122,0.45)' }}
      />
    </a>
  );
}
