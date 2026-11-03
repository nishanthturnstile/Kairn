import { Link, Outlet } from "@tanstack/react-router";
import { SampleProvider, useSample } from "./context";
import { seed } from "./controller";
import { Button } from "../components/prototype-controls";
import "./prototype.css";

function ShellContent() {
  const { state, dispatch } = useSample();
  return (
    <div className="prototype">
      <a className="sample-skip" href="#sample-content">
        Skip to content
      </a>
      <div className="sample-banner">
        Interaction prototype · fictional sample · changes clear on reload
      </div>
      <div className="sample-layout">
        <aside className="sample-sidebar">
          <Link className="sample-brand" to="/prototype">
            Kairn<span>A shared field journal</span>
          </Link>
          <nav aria-label="Prototype">
            <Link to="/prototype" activeOptions={{ exact: true }}>
              Journeys
            </Link>
            <Link to="/prototype/components">Component specimens</Link>
            <Link to="/prototype/reader">Public sample</Link>
            <Link to="/setup/status">Service status probe</Link>
          </nav>
          <p className="sample-muted">
            Capture, editing and publishing walkthroughs follow after this visual checkpoint.
          </p>
        </aside>
        <div className="sample-work">
          <header className="sample-toolbar">
            <span>Experience workshop</span>
            <span>Seed {seed.version}</span>
          </header>
          <div id="sample-content" className="sample-content">
            <Outlet />
          </div>
        </div>
        <aside className="sample-panel" aria-label="Sample controls">
          <h2>Sample controls</h2>
          <label htmlFor="sample-actor">Act as</label>
          <select
            id="sample-actor"
            value={state.actorId}
            onChange={(event) => dispatch({ type: "actor", id: event.target.value })}
          >
            {seed.actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
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
          <p role="status">{state.notice}</p>
          <p className="sample-muted">
            No accounts, uploads, map tiles, AI or business API writes. These sample identities
            grant no real access.
          </p>
        </aside>
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
