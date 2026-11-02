import { hydrateRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Reader } from "./Reader.js";
import { ReaderDataSchema } from "./data.js";
import "../styles.css";

const root = document.getElementById("reader-root");
const bootstrap = document.getElementById("reader-data");
if (!root || !bootstrap?.textContent) throw new Error("Missing reader bootstrap.");
const data = ReaderDataSchema.parse(JSON.parse(bootstrap.textContent));
const queryClient = new QueryClient();
hydrateRoot(
  root,
  <QueryClientProvider client={queryClient}>
    <Reader data={data} />
  </QueryClientProvider>,
);
