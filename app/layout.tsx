import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Space_Mono, Hanken_Grotesk } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

/**
 * Typography system.
 *  - Alto display:  Aalto, used for the cinematic zone headings.
 *  - Display serif: Instrument Serif (with its beautiful italic).
 *  - Data mono:     Space Mono, tracked out for telemetry.
 *  - Body sans:     the brief asks for Satoshi / General Sans, neither of which
 *    is served by Google Fonts. To honour the spec's overriding mandate of
 *    100% load reliability (no unstable remote font dependencies), the body is
 *    set in Hanken Grotesk — a razor-sharp neo-grotesk in the same register,
 *    self-hosted by next/font. Swap to Satoshi by self-hosting it here.
 */
const alto = localFont({
  src: '../aalto-font/aalto-display-personal-use.otf',
  variable: '--font-alto',
  display: 'swap',
});

const serif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const sans = Hanken_Grotesk({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MARIANA — The Descent',
  description:
    'An immersive descent into the Mariana Trench: the deepest, most fragile place on Earth. A conservation initiative to designate the Hadal Zone as a permanent planetary reserve.',
  keywords: ['Mariana Trench', 'ocean conservation', 'hadal zone', 'deep sea', 'sanctuary'],
  authors: [{ name: 'Mariana Sanctuary Initiative' }],
  openGraph: {
    title: 'MARIANA — The Descent',
    description:
      'A cinematic descent from the surface to 10,994 metres. Join the initiative to protect the Hadal Zone.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${alto.variable} ${serif.variable} ${mono.variable} ${sans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
