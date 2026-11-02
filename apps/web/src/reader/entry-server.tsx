import { renderToString } from "react-dom/server";
import { Reader } from "./Reader.js";
import { ReaderDataSchema, type ReaderData } from "./data.js";

export type { ReaderData } from "./data.js";
export function renderReader(input: ReaderData) {
  const data = ReaderDataSchema.parse(input);
  return { html: renderToString(<Reader data={data} />), title: "Kairn setup reader" };
}
