import { useState } from "react";
import { Button } from "./ui/button";

type Chapter = { id: string; day: number; date: string; title: string; activity: string };
export function ChapterNavigation({
  chapters,
  selected,
  onSelect,
}: {
  chapters: readonly Chapter[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="atlas-chapters" aria-label="Journey chapters">
      {chapters.map((chapter, index) => (
        <button
          type="button"
          data-slot="button"
          className="atlas-chapter"
          key={chapter.id}
          aria-current={selected === index ? "step" : undefined}
          onClick={() => onSelect(index)}
        >
          <span className="atlas-day">{String(chapter.day).padStart(2, "0")}</span>
          <span>
            <small>
              {chapter.date} / {chapter.activity}
            </small>
            <strong>{chapter.title}</strong>
          </span>
        </button>
      ))}
    </nav>
  );
}
export function PracticalDetail({
  category,
  title,
  value,
  body,
  author,
  date,
  onReadSource,
}: {
  category: string;
  title: string;
  value: string;
  body: string;
  author: string;
  date: string;
  onReadSource: () => void;
}) {
  return (
    <article className="atlas-detail">
      <span className="atlas-meta">{category}</span>
      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{body}</p>
      <p className="atlas-meta">
        Reported by {author}, {date}
      </p>
      <Button variant="secondary" onClick={onReadSource}>
        Read source chapter
      </Button>
    </article>
  );
}
export function Media({
  src,
  alt,
  caption,
  priority = false,
}: {
  src?: string;
  alt: string;
  caption: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="atlas-cover">
      {src && !failed ? (
        <img
          key={src}
          src={src}
          alt={alt}
          width="1536"
          height="1024"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="atlas-media-fallback">
          <p>{src ? "This photograph could not load." : "No cover photograph."}</p>
          <p>The journey is still here. Continue with its chapters and source details.</p>
        </div>
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
