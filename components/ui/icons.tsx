/**
 * Bespoke, hand-drawn SVG UI marks. No icon library, no generic chevrons —
 * every glyph is tuned for the thin, technical, editorial register of MARIANA.
 */

interface IconProps {
  className?: string;
}

/** Concentric sonar arcs — the initiative's mark. */
export function SonarMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="14" cy="14" r="1.4" fill="currentColor" />
      <path
        d="M14 9.5a4.5 4.5 0 0 1 4.5 4.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M14 5.5a8.5 8.5 0 0 1 8.5 8.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M14 1.8a12.2 12.2 0 0 1 12.2 12.2"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** A thin, long-tailed arrow for the call to action. */
export function ThinArrow({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 40 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M0 6h37" stroke="currentColor" strokeWidth="1" />
      <path
        d="M31.5 1 37 6l-5.5 5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Fine crosshair / fix marker for the coordinate readout. */
export function FixMarker({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="6.4" stroke="currentColor" strokeWidth="0.8" />
      <path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

/** A single corner bracket; rotate via className for the four corners. */
export function CornerBracket({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M1 8V1h7" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  );
}
