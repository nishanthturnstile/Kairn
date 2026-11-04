import { createFileRoute } from "@tanstack/react-router";
import { PrototypeShell } from "../prototype/shell";
export const Route = createFileRoute("/prototype")({ component: PrototypeShell });
