import { createFileRoute } from "@tanstack/react-router";
import { JourneyReader } from "../prototype/experience";
import { parseReaderSearch } from "../prototype/reader-navigation";
import type { ReaderSearch } from "@kairn/shared";
import reader from "../prototype/generated/reader.json";
export const Route = createFileRoute("/prototype/reader")({
  validateSearch: (input: Record<string, unknown>): ReaderSearch => {
    const valid = parseReaderSearch(input);
    // Router merges validation output with raw search: explicitly replace every
    // known field so malformed values cannot survive by omission.
    return {
      chapter: valid.chapter ?? reader.chapters[0]!.id,
      view: valid.view ?? "Story",
      days: valid.days ?? "one",
      category: valid.category ?? "All details",
    };
  },
  component: JourneyReader,
});
