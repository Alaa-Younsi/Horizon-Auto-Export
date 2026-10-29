import { Component, type ErrorInfo, type ReactNode } from "react";

const RELOAD_FLAG = "hae-chunk-reload";

interface Props {
  children: ReactNode;
  /** Rendered instead of the default full-page fallback. */
  fallback?: ReactNode;
}

/**
 * Catches render crashes. One special case: after a deploy, a tab opened on the
 * previous build requests a chunk hash that no longer exists — reload once
 * (guarded by sessionStorage so it can never loop).
 *
 * The default fallback sits OUTSIDE every provider, so it uses no app hooks and
 * prints Romanian + English directly.
 */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    if (
      /loading chunk|dynamically imported module|importing a module script failed/i.test(
        error.message,
      )
    ) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
        }
      } catch {
        // storage blocked: show the fallback instead of risking a reload loop
      }
    }
  }

  override render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="grid min-h-dvh place-items-center bg-navy-950 p-6 text-center text-white">
        <div className="max-w-md space-y-4">
          <img
            src="/brand/mark-on-navy.png"
            alt=""
            width={216}
            height={96}
            className="mx-auto h-12 w-auto"
          />
          <p className="font-display text-3xl font-semibold">A apărut o problemă</p>
          <p className="text-white/70">
            Reîncărcați pagina. Dacă problema persistă, contactați-ne.
          </p>
          <p className="text-white/70" lang="en">
            Something went wrong. Please reload the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-gold-500 px-6 py-3 font-semibold text-navy-950 hover:bg-gold-400"
          >
            Reîncarcă · Reload
          </button>
        </div>
      </div>
    );
  }
}
