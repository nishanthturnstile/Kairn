import { expect, it } from "vite-plus/test";
import { createLogger, readRuntimeConfig } from "@kairn/backend";

it("rejects an invalid process configuration without reading the host environment", () => {
  expect(readRuntimeConfig({ NODE_ENV: "test" })).toEqual({
    environment: "test",
    logLevel: "info",
  });
  expect(() => readRuntimeConfig({ LOG_LEVEL: "verbose" })).toThrow();
});

it("redacts seeded credentials from standard log fields", () => {
  const output: string[] = [];
  const secret = "KAIRN_SERVER_SECRET_FIXTURE";
  const logger = createLogger("server", readRuntimeConfig({ NODE_ENV: "test" }), {
    write: (line) => {
      output.push(line);
    },
  });
  logger.info(
    {
      password: secret,
      req: { headers: { authorization: secret, cookie: secret } },
      env: { DATABASE_URL: secret },
      safe: "visible",
    },
    "request failed",
  );
  expect(output.join("")).not.toContain(secret);
  expect(output.join("")).toContain("visible");
  expect(output.join("")).toContain("[REDACTED]");
});
