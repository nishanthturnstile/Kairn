import { queryOptions } from "@tanstack/react-query";
import { SystemStatusSchema } from "@kairn/contracts";
import { createApiClient } from "@kairn/contracts/client";

export function readApiUrl(value: string | undefined) {
  if (!value)
    return { error: "Set EXPO_PUBLIC_API_URL in apps/mobile/.env.local, then restart Metro." };
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" &&
        !(
          __DEV__ &&
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "10.0.2.2"].includes(url.hostname)
        ))
    )
      throw new Error("Invalid API origin.");
    return { baseUrl: url.origin };
  } catch {
    return {
      error: "Use the private HTTPS API origin. Local HTTP is allowed only in a development build.",
    };
  }
}

export function systemQuery(baseUrl: string) {
  return queryOptions({
    queryKey: ["system", baseUrl],
    queryFn: async ({ signal }) => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
      const timeout = setTimeout(abort, 10_000);
      try {
        const client = createApiClient({ baseUrl, fetch: (request) => fetch(request) });
        const { data, error } = await client.GET("/api/v1/system", { signal: controller.signal });
        if (error) throw new Error("The service could not return its status.");
        return SystemStatusSchema.parse(data);
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
      }
    },
    staleTime: 15_000,
    retry: false,
  });
}
