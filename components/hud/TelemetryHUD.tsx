'use client';

import { useEffect, useRef } from 'react';

import { useExperience } from '@/lib/store';
import { scrollState } from '@/lib/scroll-state';
import { ACTS, COORDINATES, type Act } from '@/lib/constants';
import { clamp, formatDepth, smoothstep } from '@/lib/math';
import { SonarMark, FixMarker, CornerBracket } from '@/components/ui/icons';

const TRACK_TOP = 12;
const TRACK_BOTTOM = 288;
const TRACK_SPAN = TRACK_BOTTOM - TRACK_TOP;
const tickY = (p: number) => TRACK_TOP + clamp(p) * TRACK_SPAN;

function currentAct(p: number): Act {
  for (const act of ACTS) {
    if (p <= act.pEnd) return act;
  }
  return ACTS[ACTS.length - 1];
}

/**
 * The fixed minimalist telemetry HUD. The depth readout, zone label, act marker
 * and gauge marker are written directly to the DOM from a single rAF loop that
 * reads the render-free scroll singleton — no React re-renders on scroll.
 */
export default function TelemetryHUD() {
  const revealed = useExperience((s) => s.revealed);

  const depthRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const actRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const traveledRef = useRef<SVGLineElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);
  const topLeftRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const depthBlockRef = useRef<HTMLDivElement>(null);
  const actBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastZone = '';
    let lastAct = '';

    const tick = () => {
      const p = clamp(scrollState.smoothProgress);
      const depth = scrollState.depth;
      const act = currentAct(scrollState.progress);

      if (depthRef.current) depthRef.current.textContent = formatDepth(depth);
      if (zoneRef.current && act.zone !== lastZone) {
        zoneRef.current.textContent = act.zone;
        lastZone = act.zone;
      }
      if (actRef.current && act.marker !== lastAct) {
        actRef.current.textContent = act.marker;
        lastAct = act.marker;
      }
      const y = tickY(p);
      if (markerRef.current) markerRef.current.setAttribute('transform', `translate(0 ${y})`);
      if (traveledRef.current) traveledRef.current.setAttribute('y2', `${y}`);

      const setOpacity = (el: HTMLElement | null, value: number) => {
        if (el) el.style.opacity = `${clamp(value)}`;
      };
      setOpacity(topLeftRef.current, 1 - smoothstep(0.93, 0.958, p));
      setOpacity(topRightRef.current, 1 - smoothstep(0.94, 0.968, p));
      setOpacity(gaugeRef.current, 1 - smoothstep(0.948, 0.978, p));
      setOpacity(depthBlockRef.current, 1 - smoothstep(0.956, 0.988, p));
      setOpacity(actBlockRef.current, 1 - smoothstep(0.964, 0.994, p));
      setOpacity(cornerRef.current, 1 - smoothstep(0.976, 0.998, p));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-1000"
      style={{ opacity: revealed ? 1 : 0 }}
    >
      {/* Corner brackets frame the viewport like a vessel viewport. */}
      <div ref={cornerRef}>
        <CornerBracket className="absolute left-5 top-5 h-4 w-4 text-white/25" />
        <CornerBracket className="absolute right-5 top-5 h-4 w-4 rotate-90 text-white/25" />
        <CornerBracket className="absolute bottom-5 left-5 h-4 w-4 -rotate-90 text-white/25" />
        <CornerBracket className="absolute bottom-5 right-5 h-4 w-4 rotate-180 text-white/25" />
      </div>

      {/* Top-left: the initiative wordmark. */}
      <div ref={topLeftRef} className="absolute left-8 top-7 flex items-center gap-3">
        <SonarMark className="h-6 w-6 text-biolume" />
        <div className="font-mono text-[10px] uppercase leading-tight tracking-telemetry text-white/65">
          <div>Mariana</div>
          <div className="text-white/35">Sanctuary Initiative</div>
        </div>
      </div>

      {/* Top-right: vessel + coordinates. */}
      <div ref={topRightRef} className="absolute right-8 top-7 flex items-center gap-3 text-right">
        <div className="font-mono text-[10px] uppercase leading-tight tracking-telemetry text-white/65">
          <div>Descent Vessel · Nereus</div>
          <div className="text-white/35">Coordinates {COORDINATES.label}</div>
        </div>
        <FixMarker className="h-6 w-6 text-hydrothermal" />
      </div>

      {/* Right edge: the depth gauge. */}
      <div ref={gaugeRef} className="absolute right-8 top-1/2 hidden -translate-y-1/2 md:block">
        <svg viewBox="0 0 70 300" className="h-[46vh] max-h-[420px] w-[70px]" fill="none">
          {/* Base track. */}
          <line x1="48" y1={TRACK_TOP} x2="48" y2={TRACK_BOTTOM} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          {/* Traveled depth. */}
          <line
            ref={traveledRef}
            x1="48"
            y1={TRACK_TOP}
            x2="48"
            y2={TRACK_TOP}
            stroke="#6366f1"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Zone ticks + depth labels. */}
          {ACTS.map((act) => {
            const y = tickY(act.pStart);
            return (
              <g key={act.id}>
                <line x1="42" y1={y} x2="54" y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <text
                  x="38"
                  y={y + 3}
                  textAnchor="end"
                  className="fill-white/40 font-mono"
                  style={{ fontSize: '8px', letterSpacing: '0.12em' }}
                >
                  {formatDepth(act.depthStart)}
                </text>
              </g>
            );
          })}
          {/* The live marker. */}
          <g ref={markerRef} transform={`translate(0 ${TRACK_TOP})`}>
            <path d="M62 -4 L52 0 L62 4 Z" fill="#d4af7a" />
            <circle cx="48" cy="0" r="2.4" fill="#d4af7a" />
          </g>
        </svg>
      </div>

      {/* Bottom-left: the primary depth readout. */}
      <div ref={depthBlockRef} className="absolute bottom-8 left-8">
        <div className="font-mono text-[10px] uppercase tracking-telemetry text-white/40">Depth</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span
            ref={depthRef}
            className="font-mono text-3xl tabular-nums tracking-wide2 text-white/95 sm:text-4xl"
          >
            0
          </span>
          <span className="font-mono text-sm uppercase tracking-telemetry text-white/40">m</span>
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-telemetry text-hydrothermal/70">
          <span ref={zoneRef}>The Surface</span>
        </div>
      </div>

      {/* Bottom-center: the act marker. */}
      <div ref={actBlockRef} className="absolute bottom-9 left-1/2 hidden -translate-x-1/2 lg:block">
        <span
          ref={actRef}
          className="font-mono text-[10px] uppercase tracking-telemetry text-white/30"
        >
          ACT I · THE EPIPELAGIC ZONE
        </span>
      </div>
    </div>
  );
}
