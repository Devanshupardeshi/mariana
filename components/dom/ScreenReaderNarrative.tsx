import { ACTS, COORDINATES, TRENCH_DEPTH } from '@/lib/constants';
import { formatDepth } from '@/lib/math';

/**
 * The complete narrative as accessible, server-rendered text. Always present in
 * the DOM (visually hidden in immersive mode) so screen readers and crawlers
 * receive the full story regardless of the WebGL experience. This is the target
 * of the "Skip to content" link.
 */
export default function ScreenReaderNarrative() {
  return (
    <section id="narrative-content" className="sr-only" tabIndex={-1} aria-label="The Descent — full narrative">
      <h1>Mariana — The Descent</h1>
      <p>
        An immersive descent into the Mariana Trench, the deepest place on Earth, reaching{' '}
        {formatDepth(TRENCH_DEPTH)} metres at {COORDINATES.lat}, {COORDINATES.lon}.
      </p>
      {ACTS.map((act) => (
        <section key={act.id} aria-label={act.marker}>
          <h2>
            {act.marker} — {act.zone}
          </h2>
          <p>{act.srText}</p>
        </section>
      ))}
      <section aria-label="Call to action">
        <h2>Secure the Sanctuary</h2>
        <p>
          We protect what we choose to understand. Join the initiative to designate the Hadal Zone as
          a permanent planetary reserve.
        </p>
      </section>
    </section>
  );
}
