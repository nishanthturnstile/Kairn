import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <main>
      <header>
        <a href="/">Kairn</a>
        <nav className="mt-4 flex gap-6" aria-label="Setup">
          <Link to="/">Home</Link>
          <Link to="/setup/status">Service status</Link>
        </nav>
      </header>
      <Outlet />
    </main>
  ),
  notFoundComponent: () => <p>This page is not available.</p>,
  errorComponent: () => <p role="alert">This page could not be loaded.</p>,
});
