import { createFileRoute } from "@tanstack/react-router";
import { ComponentCatalog } from "../prototype/component-catalog";
export const Route = createFileRoute("/prototype/components")({ component: ComponentCatalog });
