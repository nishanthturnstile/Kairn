export type ReaderSearch = {
  chapter?: string;
  view?: "Story" | "Explore" | "Learn";
  days?: "one" | "all";
  category?: string;
};

// Presentation state only: callers supply the chapter/category IDs already
// available to this reader. A route parameter never grants content access.
export function readReaderSearch(
  input: { chapter?: unknown; view?: unknown; days?: unknown; category?: unknown },
  available: { chapterIds: readonly string[]; categories: readonly string[] },
): ReaderSearch {
  return {
    ...(typeof input.chapter === "string" && available.chapterIds.includes(input.chapter)
      ? { chapter: input.chapter }
      : {}),
    ...(input.view === "Explore" || input.view === "Learn" ? { view: input.view } : {}),
    ...(input.days === "all" ? { days: "all" } : {}),
    ...(typeof input.category === "string" && available.categories.includes(input.category)
      ? { category: input.category }
      : {}),
  };
}
