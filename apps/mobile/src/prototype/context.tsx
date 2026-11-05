import { createContext, useContext, useReducer, useState, type ReactNode } from "react";
import type { ReaderSearch } from "@kairn/shared";
import { controller, initialState, type Action, type SampleState } from "./controller";
const SampleContext = createContext<{
  state: SampleState;
  dispatch: (action: Action) => void;
  reading: ReaderSearch | null;
  rememberReading: (reading: ReaderSearch) => void;
} | null>(null);
export function SampleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(controller, undefined, () => initialState());
  // Public sample presentation only; no source content, account history or durable bookmark.
  const [reading, rememberReading] = useState<ReaderSearch | null>(null);
  return (
    <SampleContext value={{ state, dispatch, reading, rememberReading }}>{children}</SampleContext>
  );
}
export function useSample() {
  const sample = useContext(SampleContext);
  if (!sample) throw new Error("Sample provider required");
  return sample;
}
