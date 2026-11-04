import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SampleProvider, useSample } from "./context";
import { seed } from "./controller";
import { Button } from "../components/prototype-controls";
import { JournalIcon } from "./visuals";
import "./prototype.css";
import "./experience.css";

function ShellContent() {
  const [dark, setDark] = useState(false);
  const { state, dispatch } = useSample();
  const actor = state.data.actors.find((item) => item.id === state.actorId)!;
  return (
    <div className="prototype" data-theme={dark ? "dark" : "light"}>
      <a className="sample-skip" href="#sample-content">
        Skip to content
      </a>
      <div className="sample-layout">
        <aside className="sample-sidebar">
          <Link className="sample-brand" to="/prototype">
            <JournalIcon name="journal" />
            Kairn
          </Link>
          <nav aria-label="Prototype">
            <Link to="/prototype/discover">
              <JournalIcon name="pin" />
              Discover
            </Link>
            <Link to="/prototype" activeOptions={{ exact: true }}>
              <JournalIcon name="journeys" />
              Your journeys
            </Link>
            <Link to="/prototype/components">
              <JournalIcon name="kit" />
              Design system
            </Link>
            <Link to="/prototype/reader">
              <JournalIcon name="reader" />
              Read a journey
            </Link>
          </nav>
          <div className="sample-rail-note">
            <JournalIcon name="journal" />
            <p>
              A little closer to
              <br />
              the places you’ve been.
            </p>
            <span>Fictional prototype</span>
          </div>
          <div className="sample-account">
            <span className="sample-avatar">
              {actor.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
            <div>
              <strong>{actor.name}</strong>
              <small>Sample account</small>
            </div>
          </div>
        </aside>
        <div className="sample-work">
          <header className="sample-toolbar">
            <span>Capture. Experience. Learn.</span>
            <Button variant="secondary" aria-pressed={dark} onClick={() => setDark(!dark)}>
              Dark appearance
            </Button>
            <details className="sample-tools">
              <summary>
                <JournalIcon name="settings" />
                Sample controls
              </summary>
              <div className="sample-panel">
                <h2>Sample controls</h2>
                <p className="sample-muted">Fictional data. Changes clear on reload.</p>
                <label htmlFor="sample-actor">Act as</label>
                <select
                  id="sample-actor"
                  value={state.actorId}
                  onChange={(event) => dispatch({ type: "actor", id: event.target.value })}
                >
                  {seed.actors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="sample-scenario">Prepared checkpoint</label>
                <select
                  id="sample-scenario"
                  value={state.scenario}
                  onChange={(event) => dispatch({ type: "reset", scenario: event.target.value })}
                >
                  {seed.scenarios.map((scenario) => (
                    <option key={scenario}>{scenario}</option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  onClick={() => dispatch({ type: "reset", scenario: "first-run" })}
                >
                  Reset all sample changes
                </Button>
                <p className="sample-muted">
                  No accounts, uploads, map tiles, AI or business API writes. Seed {seed.version}.
                </p>
                <Link to="/setup/status">Service status probe</Link>
              </div>
            </details>
          </header>
          <main id="sample-content" className="sample-content">
            <Outlet />
          </main>
          <footer className="sample-session">
            <span className="sample-status-dot" />
            <span role="status">{state.notice}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
export function PrototypeShell() {
  return (
    <SampleProvider>
      <ShellContent />
    </SampleProvider>
  );
}
