import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../components/prototype-controls";
import reader from "./generated/reader.json";
import ridge from "./generated/ridge-sample.png";
import { Contributors } from "./visuals";
import "./experience.css";

type Mode = "Story" | "Explore" | "Learn";

function RouteDiagram({ chapter }: { chapter: (typeof reader.chapters)[number] }) {
  return (
    <figure className="atlas-map">
      <svg
        viewBox="0 0 460 290"
        role="img"
        aria-label={`${chapter.title}: ${chapter.evidence}. Illustrative route diagram, not a geographical map.`}
      >
        <title>Illustrative route diagram; not for navigation</title>
        <text x="24" y="32">
          Hill country
        </text>
        {reader.chapters
          .filter((item) => item.route.length)
          .map((item) => (
            <polyline
              key={item.id}
              points={item.route.map((point) => point.join(",")).join(" ")}
              className={item.id === chapter.id ? "atlas-route active" : "atlas-route"}
              strokeDasharray={
                item.evidence === "Recorded"
                  ? undefined
                  : item.evidence === "Reported"
                    ? "8 6"
                    : "2 7"
              }
            />
          ))}
        {chapter.route.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={index === 0 ? 7 : 4} className="atlas-stop" />
        ))}
        <text x="24" y="275">
          Station
        </text>
        <text x="350" y="45">
          Ridge
        </text>
      </svg>
      <figcaption>
        Illustrative geometry.{" "}
        {chapter.route.length
          ? `${chapter.evidence} segment selected.`
          : "No location recorded for this day. No connecting route inferred."}
      </figcaption>
    </figure>
  );
}

export function JourneyReader() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<Mode>("Story");
  const [mapOpen, setMapOpen] = useState(false);
  const [category, setCategory] = useState("All details");
  const chapter = reader.chapters[selected]!;
  function choose(index: number) {
    setSelected(index);
  }
  return (
    <div className="atlas-reader">
      <div className="atlas-reader-heading">
        <div>
          <p className="atlas-meta">
            {reader.place} / {reader.dates}
          </p>
          <h1>{reader.title}</h1>
          <p>{reader.description}</p>
          <Contributors />
        </div>
        <figure className="atlas-cover">
          <img
            src={ridge}
            alt="Green hills in morning mist. AI-generated sample imagery."
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <figcaption>Fictional journey · generated sample image</figcaption>
        </figure>
      </div>
      <div className="atlas-reader-bar">
        <div className="atlas-segments" role="group" aria-label="Journey view">
          {(["Story", "Explore", "Learn"] as const).map((item) => (
            <Button
              key={item}
              variant="secondary"
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <span className="atlas-meta">Four days. Every part belongs.</span>
      </div>
      <div className="atlas-reading-layout">
        <nav className="atlas-chapters" aria-label="Journey chapters">
          {reader.chapters.map((item, index) => (
            <button
              data-slot="button"
              className="atlas-chapter"
              key={item.id}
              aria-current={selected === index ? "step" : undefined}
              onClick={() => choose(index)}
            >
              <span className="atlas-day">{String(item.day).padStart(2, "0")}</span>
              <span>
                <small>
                  {item.date} / {item.activity}
                </small>
                <strong>{item.title}</strong>
              </span>
            </button>
          ))}
        </nav>
        <section className="atlas-reading" aria-label={mode}>
          {mode === "Learn" ? (
            <>
              <h2>The details you take with you</h2>
              <p>
                Firsthand observations, with the gaps left visible. All values below are fictional
                examples.
              </p>
              <label className="atlas-filter">
                Find practical details
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {["All details", ...reader.details.map((item) => item.category)].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              {reader.details
                .filter((item) => category === "All details" || category === item.category)
                .map((item) => (
                  <article className="atlas-detail" key={item.category}>
                    <span className="atlas-meta">{item.category}</span>
                    <h3>{item.title}</h3>
                    <strong>{item.value}</strong>
                    <p>{item.body}</p>
                    <p className="atlas-meta">
                      Reported by {item.author}, {item.date}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        choose(item.chapter);
                        setMode("Story");
                      }}
                    >
                      Read source chapter
                    </Button>
                  </article>
                ))}
            </>
          ) : (
            <>
              <div className="atlas-chapter-heading" aria-live="polite">
                <p className="atlas-meta">
                  Day {chapter.day} / {chapter.place}
                </p>
                <h2>{chapter.title}</h2>
              </div>
              {mode === "Story" ? (
                <>
                  <p className="atlas-prose">{chapter.body}</p>
                  <blockquote>
                    {chapter.reflection}
                    <cite>{chapter.author}</cite>
                  </blockquote>
                  <p className="atlas-meta">
                    {chapter.date} 2026 · Fictional source {chapter.source}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {chapter.activity}. Evidence: <strong>{chapter.evidence}</strong>.
                  </p>
                  <p>
                    {chapter.route.length
                      ? "See how this chapter fits into the whole journey. The diagram shows sequence only, not surveyed geography."
                      : "A rest day has a place in the chronology even when its location is unknown."}
                  </p>
                </>
              )}
              <Button
                variant="secondary"
                onClick={() => setMapOpen(!mapOpen)}
                aria-expanded={mapOpen}
                aria-controls="chapter-geography"
              >
                {mapOpen ? "Close route context" : "Open route context"}
              </Button>
              {mapOpen && (
                <div id="chapter-geography">
                  <RouteDiagram chapter={chapter} />
                  <p className="atlas-legend">
                    <span>Solid: recorded</span>
                    <span>Dashed: reported</span>
                    <span>Dotted: estimated</span>
                  </p>
                </div>
              )}
              <div className="atlas-pagination">
                <Button
                  variant="secondary"
                  disabled={selected === 0}
                  onClick={() => choose(selected - 1)}
                >
                  Previous day
                </Button>
                <span>
                  {selected + 1} of {reader.chapters.length}
                </span>
                <Button
                  disabled={selected === reader.chapters.length - 1}
                  onClick={() => choose(selected + 1)}
                >
                  Next day
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
      <details className="atlas-disclosure">
        <summary>About this sample</summary>
        <p>{reader.notice} No live maps, publication or travel recommendations are provided.</p>
      </details>
    </div>
  );
}

export function Discover() {
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState("All journeys");
  const matches =
    `${reader.title} ${reader.place} hiking train rest`
      .toLowerCase()
      .includes(query.trim().toLowerCase()) && activity !== "Cycling";
  return (
    <div className="atlas-discover">
      <div className="atlas-discover-heading">
        <h1>
          There’s more to
          <br />
          every journey.
        </h1>
        <p>
          Follow the days between leaving and coming home.
          <br />
          The big views. The small discoveries. All of it.
        </p>
      </div>
      <div className="atlas-search">
        <label>
          Find a place or journey
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try hill country"
          />
        </label>
        <label>
          Travel your way
          <select value={activity} onChange={(event) => setActivity(event.target.value)}>
            {["All journeys", "Hiking", "Train journeys", "Cycling"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="atlas-meta" role="status">
        {matches ? "1 sample journey" : "No matching sample journeys"}
      </p>
      {matches ? (
        <article className="atlas-feature">
          <figure className="atlas-cover">
            <img
              src={ridge}
              width="1536"
              height="1024"
              alt="A winding path through green hills. Generated sample image."
              fetchPriority="high"
            />
            <figcaption>Generated sample imagery</figcaption>
          </figure>
          <div className="atlas-feature-story">
            <p className="atlas-meta">Four days in the hill country</p>
            <h2>{reader.title}</h2>
            <p>{reader.description}</p>
            <div className="atlas-itinerary">
              <span>Train</span>
              <span>Ridge walk</span>
              <span>Rest</span>
              <span>Home</span>
            </div>
            <Contributors />
            <Link className="atlas-read-link" to="/prototype/reader">
              Step into the journey
            </Link>
          </div>
        </article>
      ) : (
        <section className="sample-empty">
          <h2>A little further afield?</h2>
          <p>This demonstration has one journey. Try “hill country” or clear the filters.</p>
          <Button
            onClick={() => {
              setQuery("");
              setActivity("All journeys");
            }}
          >
            Clear filters
          </Button>
        </section>
      )}
      <section className="atlas-invitation">
        <h2>Every journey has more than one story.</h2>
        <p>Bring your photographs, your people and the details you want to remember.</p>
        <Link to="/prototype">Start with your journeys</Link>
      </section>
    </div>
  );
}
