'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Minimal error boundary used to guarantee robustness around optional assets
 * (e.g. the salvage GLB). If anything inside throws — a failed fetch, a decode
 * error — we silently render the procedural fallback instead of crashing the
 * whole canvas.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Non-fatal: the fallback keeps the scene intact.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MARIANA] Optional asset failed, using procedural fallback.', error);
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
