import { createFileRoute } from "@tanstack/react-router";
import { SystemStatus } from "../SystemStatus.js";
import { systemQuery } from "../system-query.js";

export const Route = createFileRoute("/setup/status")({
  loader: ({ context }) => context.queryClient.ensureQueryData(systemQuery(window.location.origin)),
  component: () => (
    <section>
      <h1>Service status</h1>
      <SystemStatus />
    </section>
  ),
});
