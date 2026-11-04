import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { fontLicenses } from "../font-licenses";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <main className="creator-shell">
      <header className="creator-header">
        <a href="/">Kairn</a>
        <nav className="mt-4 flex gap-6" aria-label="Navigation">
          <Link to="/">Home</Link>
          <Link to="/setup/status">Connection status</Link>
          {typeof document !== "undefined" &&
          document.documentElement.dataset.accountsEnabled === "true" ? (
            <Link to="/account">Your account</Link>
          ) : null}
          {import.meta.env.DEV ? <Link to="/setup/accounts">Account specimens</Link> : null}
        </nav>
      </header>
      <Outlet />
      <footer className="creator-footer">
        <a href={fontLicenses.newsreader}>Newsreader license</a>
        <a href={fontLicenses.instrumentSans}>Instrument Sans license</a>
      </footer>
    </main>
  ),
  notFoundComponent: () => <p>This page is not available.</p>,
  errorComponent: () => <p role="alert">This page could not be loaded.</p>,
});
