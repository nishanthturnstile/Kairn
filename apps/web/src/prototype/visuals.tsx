import type { ReactNode } from "react";
import ridge from "./generated/ridge-sample.png";
import { seed } from "./controller";

const paths = {
  journal: "M4 4h7l2 2h7v14h-7l-2-2H4z M8 8v6 M16 10v6",
  journeys: "M3 7h18v14H3z M8 7V3h8v4 M3 12h18 M8 10v4 M16 10v4",
  kit: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  reader: "M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2z M12 6v15",
  settings: "M4 7h16 M4 17h16 M9 4v6 M16 14v6",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z M12 8v4 M10 10h4",
  lock: "M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4",
} as const;
export function JournalIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Contributors() {
  const members = seed.actors.filter((actor) => actor.member);
  return (
    <div className="sample-contributors">
      <div
        className="sample-avatar-stack"
        aria-label={members.map((actor) => actor.name).join(", ")}
      >
        {members.slice(0, 3).map((actor) => (
          <span className="sample-avatar" key={actor.id} aria-hidden="true">
            {actor.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
        ))}
        <span className="sample-avatar" aria-hidden="true">
          +2
        </span>
      </div>
      <span>A journal shared by five</span>
    </div>
  );
}
export function JourneyCover({
  title,
  children,
  compact = false,
}: {
  title: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "sample-cover sample-cover-compact" : "sample-cover"}>
      <div className="sample-cover-image">
        <img
          src={ridge}
          alt="A narrow path through green hills in soft morning mist. AI-generated sample."
          fetchPriority="high"
        />
        <span className="sample-media-label">Fictional journey · sample image</span>
      </div>
      <div className="sample-cover-body">
        <div className="sample-cover-meta">
          <span>
            <JournalIcon name="pin" />
            Hill country
          </span>
          <span>11–14 July 2026</span>
        </div>
        <h2>{title}</h2>
        <div className="sample-cover-bottom">
          <Contributors />
          {children}
        </div>
      </div>
    </article>
  );
}
