import { createFileRoute, notFound } from "@tanstack/react-router";
import { AccountJourneySpecimens } from "../features/accounts/specimens";

export const Route = createFileRoute("/setup/accounts")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: AccountJourneySpecimens,
});
