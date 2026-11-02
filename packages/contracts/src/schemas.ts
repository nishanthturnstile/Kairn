import { z } from "zod";

export const CONTRACT_VERSION = 1;
export const SYSTEM_PATH = "/api/v1/system";

export const SystemStatusSchema = z.strictObject({
  contractVersion: z.literal(CONTRACT_VERSION),
  syncProtocolVersion: z.number().int().positive(),
  status: z.literal("ok"),
});

export const ApiErrorSchema = z.strictObject({
  code: z.enum(["invalid_request", "unsupported_protocol", "internal_error"]),
  message: z.string().min(1).max(256),
});

export type SystemStatus = z.infer<typeof SystemStatusSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
