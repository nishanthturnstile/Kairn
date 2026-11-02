import createClient, { type ClientOptions } from "openapi-fetch";
import type { paths } from "../generated/api.js";

export type ApiClientOptions = {
  baseUrl: string;
  fetch: NonNullable<ClientOptions["fetch"]>;
};

export function createApiClient(options: ApiClientOptions) {
  const url = new URL(options.baseUrl);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "API base URL must be an absolute HTTP(S) URL without credentials, query, or fragment.",
    );
  }
  if (typeof options.fetch !== "function")
    throw new Error("An explicit fetch transport is required.");
  return createClient<paths>({ baseUrl: url.href.replace(/\/$/, ""), fetch: options.fetch });
}

export type { components, operations, paths } from "../generated/api.js";
