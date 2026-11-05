import { expect, test } from "vite-plus/test";
import { parseReaderSearch as web } from "../../apps/web/src/prototype/reader-navigation.js";
import { parseReaderSearch as native } from "../../apps/mobile/src/prototype/reader-navigation.js";

test("both reader boundaries retain valid context and reject stale, ambiguous or private-source parameters", () => {
  for (const parse of [web, native]) {
    const context = { chapter: "rest", view: "Learn", days: "all", category: "Costs" };
    expect(parse(context)).toEqual(context);
    expect(parse(parse(context))).toEqual(context);
    for (const chapter of [
      "removed-chapter",
      "sample-moment-19",
      ["rest", "ridge"],
      { id: "rest" },
    ]) {
      expect(
        parse({ chapter, view: "unsupported", days: ["all"], category: "unavailable" }),
      ).toEqual({});
    }
    expect(
      parse({ chapter: "ridge", view: "Story", days: "one", category: "All details" }),
    ).toEqual({ chapter: "ridge" });
  }
});
