import { createContext, useContext, useReducer, type ReactNode } from "react";
import { controller, initialState, type Action, type SampleState } from "./controller";

const SampleContext = createContext<{
  state: SampleState;
  dispatch: (action: Action) => void;
} | null>(null);
export function SampleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(controller, undefined, () => initialState());
  return <SampleContext value={{ state, dispatch }}>{children}</SampleContext>;
}
export function useSample() {
  const value = useContext(SampleContext);
  if (!value) throw new Error("SampleProvider is required");
  return value;
}
