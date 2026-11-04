import { betterAuth } from "better-auth";
import { authOptions } from "@kairn/backend/auth-options";

// Offline schema input only. The CLI's explicit --adapter/--dialect avoids a database connection.
export const auth = betterAuth({ ...authOptions, baseURL: "https://kairn.invalid" });
