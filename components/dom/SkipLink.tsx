'use client';

/**
 * Visually hidden until focused. Lets keyboard and screen-reader users jump
 * straight past the immersive canvas to the readable narrative content.
 */
export default function SkipLink() {
  return (
    <a
      href="#narrative-content"
      className="sr-only z-[80] rounded-full border border-hydrothermal/60 bg-void px-5 py-3 font-mono text-[11px] uppercase tracking-telemetry text-white focus:not-sr-only focus:fixed focus:left-6 focus:top-6"
    >
      Skip to content
    </a>
  );
}
