import { createFileRoute } from "@tanstack/react-router";
import { JourneyOverview } from "../prototype/journeys";
export const Route = createFileRoute("/prototype/journey/$journeyId")({ component: Screen });
function Screen() {
  const { journeyId } = Route.useParams();
  return <JourneyOverview journeyId={journeyId} />;
}
