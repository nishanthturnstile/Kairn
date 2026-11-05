import { ChapterNavigation, PracticalDetail, Media } from "../components/journey-content";
import { Input } from "../components/ui/input";
import { SegmentedControl, Select } from "../components/ui/form-controls";
import { useEffect, useId, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import type { ReaderSearch } from "@kairn/shared";
import { Button } from "../components/prototype-controls";
import reader from "./generated/reader.json";
import ridge from "./generated/ridge-sample.png";
import { Contributors } from "./visuals";
import { useSample } from "./context";
import { parseReaderSearch } from "./reader-navigation";
import "./experience.css";

type Mode = "Story" | "Explore" | "Learn";
const readerRoute = getRouteApi("/prototype/reader");

function ReaderChapter({
  chapter,
  mode,
  allDays,
  onReadDay,
}: {
  chapter: (typeof reader.chapters)[number];
  mode: Exclude<Mode, "Learn">;
  allDays: boolean;
  onReadDay: () => void;
}) {
  const titleId = useId();
  const Heading = allDays ? "h3" : "h2";
  return (
    <article className={allDays ? "atlas-day-story" : undefined} aria-labelledby={titleId}>
      <div className="atlas-chapter-heading" aria-live={allDays ? undefined : "polite"}>
        <p className="atlas-meta">
          Day {chapter.day} / {chapter.date} / {chapter.place}
        </p>
        <Heading id={titleId}>{chapter.title}</Heading>
      </div>
      <p className="atlas-meta">
        {chapter.activity} · Evidence: {chapter.evidence}
      </p>
      {mode === "Story" ? (
        <>
          <p className="atlas-prose">{chapter.body}</p>
          <blockquote>
            {chapter.reflection}
            <cite>{chapter.author}</cite>
          </blockquote>
        </>
      ) : (
        <p>
          {chapter.route.length
            ? "The diagram shows sequence only, not surveyed geography."
            : "No location was recorded. No connecting route is inferred."}
        </p>
      )}
      <p className="atlas-meta">
        {chapter.date} 2026 · Fictional source {chapter.source} · {chapter.author}
      </p>
      {allDays && (
        <Button variant="secondary" onClick={onReadDay}>
          Read day {chapter.day}
        </Button>
      )}
    </article>
  );
}

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
  const search = readerRoute.useSearch();
  const navigate = readerRoute.useNavigate();
  const { rememberReading } = useSample();
  const selected = Math.max(
    0,
    reader.chapters.findIndex((chapter) => chapter.id === search.chapter),
  );
  const mode = search.view ?? "Story";
  const allDays = search.days === "all";
  const category = search.category ?? "All details";
  const [mapOpen, setMapOpen] = useState(false);
  const categoryId = useId();
  const chapter = reader.chapters[selected]!;
  useEffect(() => rememberReading(parseReaderSearch(search)), [search, rememberReading]);
  function update(next: ReaderSearch, replace = true) {
    void navigate({ search: parseReaderSearch(next), replace, resetScroll: false });
  }
  function choose(index: number) {
    const next = reader.chapters[index];
    const { days: _days, ...rest } = search;
    if (next) update({ ...rest, chapter: next.id }, false);
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
        <Media
          src={ridge}
          alt="Green hills in morning mist. AI-generated sample imagery."
          caption="Fictional journey · generated sample image"
          priority
        />
      </div>
      <div className="atlas-reader-bar">
        <SegmentedControl
          label="Journey view"
          value={mode}
          options={["Story", "Explore", "Learn"]}
          onChange={(value) => {
            if (value === "Story" || value === "Explore" || value === "Learn")
              update({ ...search, view: value });
          }}
        />
        <SegmentedControl
          label="Reading scope"
          value={allDays ? "All days" : "One day"}
          options={["One day", "All days"]}
          onChange={(value) => {
            const { days: _days, ...rest } = search;
            update(value === "All days" ? { ...rest, days: "all" } : rest);
          }}
        />
      </div>
      <div className="atlas-reading-layout">
        <ChapterNavigation
          chapters={reader.chapters}
          selected={allDays ? null : selected}
          onSelect={choose}
        />
        <section className="atlas-reading" aria-label={mode}>
          {mode === "Learn" ? (
            <>
              <h2>The details you take with you</h2>
              <p>
                Firsthand observations, with the gaps left visible. All values below are fictional
                examples.
              </p>
              <p className="atlas-meta">
                Practical details span the whole sample. Your day and reading scope are kept when
                you return to Story or Explore.
              </p>
              <div className="atlas-filter">
                <label htmlFor={categoryId}>Find practical details</label>
                <Select
                  id={categoryId}
                  value={category}
                  onChange={(event) => update({ ...search, category: event.target.value })}
                >
                  {["All details", ...reader.details.map((item) => item.category)].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </div>
              {reader.details
                .filter((item) => category === "All details" || category === item.category)
                .map((item) => (
                  <PracticalDetail
                    key={item.category}
                    {...item}
                    onReadSource={() => {
                      const { days: _days, ...rest } = search;
                      update(
                        { ...rest, chapter: reader.chapters[item.chapter]!.id, view: "Story" },
                        false,
                      );
                    }}
                  />
                ))}
            </>
          ) : (
            <>
              {allDays && (
                <div className="atlas-chapter-heading" aria-live="polite">
                  <h2>All days</h2>
                  <p>
                    Every chapter in order, including rest and transfer days. Unknown locations
                    remain gaps.
                  </p>
                </div>
              )}
              <div className={allDays ? "atlas-all-days" : undefined}>
                {(allDays ? reader.chapters : [chapter]).map((item) => (
                  <ReaderChapter
                    key={item.id}
                    chapter={item}
                    mode={mode}
                    allDays={allDays}
                    onReadDay={() =>
                      choose(reader.chapters.findIndex((entry) => entry.id === item.id))
                    }
                  />
                ))}
              </div>
              {allDays && (
                <p className="atlas-meta">
                  Route context: Day {chapter.day} / {chapter.title}
                </p>
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
              {!allDays && (
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
              )}
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
  const { reading } = useSample();
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
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try hill country"
          />
        </label>
        <label>
          Travel your way
          <Select value={activity} onChange={(event) => setActivity(event.target.value)}>
            {["All journeys", "Hiking", "Train journeys", "Cycling"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
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
            <Link className="atlas-read-link" to="/prototype/reader" search={reading ?? {}}>
              {reading ? "Continue reading" : "Step into the journey"}
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
