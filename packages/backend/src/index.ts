import { pino, type DestinationStream } from "pino";
import { z } from "zod";

const LogLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);
const RuntimeConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: LogLevelSchema.default("info"),
});

/** Each process passes its own environment explicitly; imports do not read process.env. */
export function readRuntimeConfig(environment: Record<string, string | undefined>) {
  const config = RuntimeConfigSchema.parse(environment);
  return { environment: config.NODE_ENV, logLevel: config.LOG_LEVEL };
}

export function createLogger(
  service: "server" | "worker",
  config: ReturnType<typeof readRuntimeConfig>,
  destination?: DestinationStream,
) {
  const options = {
    name: service,
    level: config.logLevel,
    // Log only safe operational fields. These paths cover standard secret containers.
    redact: {
      paths: [
        "authorization",
        "cookie",
        "password",
        "token",
        "secret",
        "env",
        "req.headers.authorization",
        "req.headers.cookie",
        "headers.authorization",
        "headers.cookie",
        "*.password",
        "*.token",
        "*.secret",
      ],
      censor: "[REDACTED]",
    },
  };
  return destination ? pino(options, destination) : pino(options);
}
