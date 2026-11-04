import { writeFile } from "node:fs/promises";
import { tokens } from "../dist/index.js";

/** @param {string} name */
const kebab = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const unitless = new Set(["color", "weight", "columns", "family"]);
/** @param {unknown} value @param {string[]} path @returns {string[]} */
function declarations(value, path = []) {
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => declarations(child, [...path, key]));
  }
  const unit =
    typeof value === "number" &&
    !path.some((part) => unitless.has(part)) &&
    path.at(-1) !== "opacity" &&
    !path.at(-1)?.endsWith("Ratio")
      ? "px"
      : "";
  const cssValue = path.includes("family") ? JSON.stringify(value) : String(value);
  return [`  --kairn-${path.map(kebab).join("-")}: ${cssValue}${unit};`];
}

await writeFile(
  new URL("../dist/tokens.css", import.meta.url),
  `/* Generated from @kairn/design-tokens. */\n:root {\n${declarations(tokens).join("\n")}\n}\n`,
);
