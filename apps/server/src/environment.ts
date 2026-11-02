import { z } from "zod";
import { readRuntimeConfig } from "@kairn/backend";

const EnvironmentSchema = z.object({
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_ORIGIN: z.url().default("http://localhost:8080"),
});
export function readServerEnvironment(input: Record<string, string | undefined>) {
  const environment = EnvironmentSchema.parse(input);
  const origin = new URL(environment.PUBLIC_ORIGIN);
  if (!["http:", "https:"].includes(origin.protocol) || origin.href !== `${origin.origin}/`) {
    throw new Error(
      "PUBLIC_ORIGIN must be an HTTP(S) origin without a path, credentials, query, or fragment.",
    );
  }
  return {
    ...readRuntimeConfig(input),
    host: environment.HOST,
    port: environment.PORT,
    publicOrigin: origin.origin,
  };
}
