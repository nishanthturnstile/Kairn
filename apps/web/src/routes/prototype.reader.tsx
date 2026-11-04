import { createFileRoute } from "@tanstack/react-router";
import { JourneyReader } from "../prototype/experience";
export const Route = createFileRoute("/prototype/reader")({ component: JourneyReader });
