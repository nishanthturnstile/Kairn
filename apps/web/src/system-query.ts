import { queryOptions } from "@tanstack/react-query";
import { SystemStatusSchema } from "@kairn/contracts";
import { createApiClient } from "@kairn/contracts/client";

export function systemQuery(baseUrl: string) {
  return queryOptions({
    queryKey: ["system", baseUrl],
    queryFn: async ({ signal }) => {
      const client = createApiClient({ baseUrl, fetch: (request) => fetch(request) });
      const { data, error } = await client.GET("/api/v1/system", { signal });
      if (error) throw new Error("Service status is unavailable.");
      return SystemStatusSchema.parse(data);
    },
    staleTime: 15_000,
    retry: false,
  });
}
