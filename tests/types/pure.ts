import { assertNever } from "@kairn/shared";
import { tokens } from "@kairn/design-tokens";

const radius: 12 = tokens.radius.medium;
// @ts-expect-error Exhaustive checking must reject a remaining union member.
assertNever("unhandled");
// @ts-expect-error Pure packages must not introduce Node globals.
process;
// @ts-expect-error Pure packages must not introduce DOM globals.
document;
// @ts-expect-error Pure packages must not introduce React types.
type ReactLeak = React.ReactNode;
export { radius };
export type { ReactLeak };
