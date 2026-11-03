// Shared by schema generation and the later runtime factory. No secrets, sockets or environment reads.
// Auth routes stay unmounted until durable mail, password blocklist and native/web transports qualify.
export const authOptions = {
  appName: "Kairn",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 15,
    maxPasswordLength: 256, // Library uses UTF-16 units; runtime must also enforce the scalar policy.
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    expiresIn: 24 * 60 * 60,
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60,
    freshAge: 10 * 60,
    disableSessionRefresh: true,
    cookieCache: { enabled: false },
  },
  user: { deleteUser: { enabled: false } },
  rateLimit: { enabled: true, storage: "database" },
} as const;
