import { lazy, Suspense, useState } from "react";
import type { ReaderData } from "./data.js";

const Details = lazy(() => import("./ReaderDetails.js"));

export function Reader({ data }: { data: ReaderData }) {
  const [read, setRead] = useState(false);
  const [details, setDetails] = useState(false);
  return (
    <main>
      <header>
        <a href="/">Kairn</a>
        <p className="eyebrow">Repository setup fixture</p>
        <h1>A quiet page, ready to read.</h1>
      </header>
      <article className="surface">
        <p>
          This synthetic passage verifies that reading starts with server-rendered text. It contains
          no journey data.
        </p>
        <p className="marker" data-testid="request-marker">
          {data.marker}
        </p>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setRead(true)} disabled={read}>
            {read ? "Marked as read" : "Mark as read"}
          </button>
          <button onClick={() => setDetails(true)} disabled={details}>
            Check service status
          </button>
        </div>
        {details ? (
          <Suspense fallback={<p role="status">Loading service check…</p>}>
            <Details />
          </Suspense>
        ) : null}
      </article>
    </main>
  );
}
