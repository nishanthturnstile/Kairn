import { z } from "zod";

export const ReaderDataSchema = z.strictObject({ marker: z.string().min(1).max(200) });
export type ReaderData = z.infer<typeof ReaderDataSchema>;
