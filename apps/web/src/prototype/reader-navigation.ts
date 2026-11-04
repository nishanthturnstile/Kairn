import { readReaderSearch } from "@kairn/shared";
import reader from "./generated/reader.json" with { type: "json" };

const available = {
  chapterIds: reader.chapters.map((chapter) => chapter.id),
  categories: reader.details.map((detail) => detail.category),
};

export function parseReaderSearch(input: {
  chapter?: unknown;
  view?: unknown;
  days?: unknown;
  category?: unknown;
}) {
  return readReaderSearch(input, available);
}
