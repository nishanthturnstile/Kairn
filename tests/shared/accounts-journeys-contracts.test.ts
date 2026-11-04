import { describe, expect, it } from "vite-plus/test";
import {
  ChangeCapabilitiesSchema,
  DeleteAccountSchema,
  ExactExportAssetsSchema,
  ExportGrantSchema,
  NoticeSchema,
  CreateJourneySchema,
  DisplayNameSchema,
  EntityTagSchema,
  FormerJourneyReferenceSchema,
  JourneyDetailsSchema,
  PasswordSchema,
  PeopleSchema,
  ResolveInvitationSchema,
  ResolvedInvitationSchema,
  RestrictionResultSchema,
  RestrictionPendingSchema,
  RestrictionCompleteSchema,
} from "@kairn/contracts";
import { createApiClient } from "@kairn/contracts/client";

const commandId = "b039656c-f32c-4eec-8756-328de4feb8c0";
const journeyId = "63d4c78f-443a-4d92-bd56-1a20594a5b8c";
const powers = { administrator: false, coauthor: false, publisher: true };
const details = {
  title: "A shared field note",
  timeZone: "Asia/Kolkata",
  start: { local: "2026-11-03T09:00", instant: "2026-11-03T03:30:00Z", offsetMinutes: 330 },
  end: null,
  category: null,
};

describe("account/journey wire safety", () => {
  it("binds every exact export asset separately and rejects wildcard/duplicate or indefinite approvals", () => {
    const asset = {
      assetId: commandId,
      sourceId: journeyId,
      assetRevision: 1,
      sourceGrantId: journeyId,
      sourceGrantRevision: 2,
    };
    expect(ExactExportAssetsSchema.safeParse([asset]).success).toBe(true);
    expect(ExactExportAssetsSchema.safeParse([asset, asset]).success).toBe(false);
    expect(
      ExactExportAssetsSchema.safeParse([{ ...asset, includeFutureFiles: true }]).success,
    ).toBe(false);
    const grant = {
      grantId: commandId,
      journeyId,
      ownerAccountId: commandId,
      recipientAccountId: journeyId,
      recipientMembershipId: journeyId,
      recipientMembershipEpoch: 1,
      revision: 1,
      etag: '"export-grant-1"',
      state: "active",
      assets: [asset],
      issuedAt: "2026-11-03T00:00:00Z",
      expiresAt: "2026-11-04T00:00:00Z",
    };
    expect(ExportGrantSchema.safeParse(grant).success).toBe(true);
    expect(
      ExportGrantSchema.safeParse({ ...grant, expiresAt: "2026-11-11T00:00:00Z" }).success,
    ).toBe(false);
  });
  it("keeps deletion consent and unavailable notices narrowly scoped", () => {
    const deletion = {
      commandId,
      impactToken: "a".repeat(43),
      confirmAccountDeletion: true,
      confirmation: "DELETE MY ACCOUNT",
    };
    expect(DeleteAccountSchema.safeParse(deletion).success).toBe(true);
    expect(DeleteAccountSchema.safeParse({ ...deletion, keepSourcesShared: true }).success).toBe(
      false,
    );
    const notice = {
      noticeId: commandId,
      createdAt: "2026-11-03T00:00:00Z",
      read: false,
      targetState: "unavailable",
    };
    expect(NoticeSchema.safeParse(notice).success).toBe(true);
    expect(NoticeSchema.safeParse({ ...notice, journeyId, title: "Hidden title" }).success).toBe(
      false,
    );
  });
  it("counts astral text identically and preserves password bytes while trimming names", () => {
    expect(DisplayNameSchema.parse(`  ${"🌿".repeat(80)}  `)).toBe("🌿".repeat(80));
    expect(DisplayNameSchema.safeParse("🌿".repeat(81)).success).toBe(false);
    expect(DisplayNameSchema.safeParse(" \n ").success).toBe(false);
    const password = ` ${"🌿".repeat(13)} `;
    expect(PasswordSchema.parse(password)).toBe(password);
    expect(PasswordSchema.safeParse("🌿".repeat(14)).success).toBe(false);
    expect(PasswordSchema.safeParse("🌿".repeat(128)).success).toBe(true);
    expect(PasswordSchema.safeParse("🌿".repeat(129)).success).toBe(false);
    expect(PasswordSchema.safeParse(`${"x".repeat(128)}\n`).success).toBe(false);
    expect(PasswordSchema.safeParse(`password long enough\ud800`).success).toBe(false);
  });

  it("rejects impossible local times, inconsistent offsets and reversed chronology", () => {
    expect(JourneyDetailsSchema.parse(details)).toEqual(details);
    for (const year of ["0001", "0099", "0999", "1000", "9999"]) {
      expect(
        JourneyDetailsSchema.safeParse({
          ...details,
          timeZone: "UTC",
          start: {
            local: `${year}-01-01T09:00`,
            instant: `${year}-01-01T09:00:00Z`,
            offsetMinutes: 0,
          },
          end: null,
        }).success,
      ).toBe(true);
    }
    expect(
      JourneyDetailsSchema.safeParse({ ...details, start: { ...details.start, offsetMinutes: 0 } })
        .success,
    ).toBe(false);
    expect(
      JourneyDetailsSchema.safeParse({
        ...details,
        start: { ...details.start, local: "2026-02-30T09:00" },
      }).success,
    ).toBe(false);
    expect(JourneyDetailsSchema.safeParse({ ...details, timeZone: "+05:30" }).success).toBe(false);
    expect(
      JourneyDetailsSchema.safeParse({
        ...details,
        end: { local: "2026-11-03T08:00", instant: "2026-11-03T02:30:00Z", offsetMinutes: 330 },
      }).success,
    ).toBe(false);
    const newYork = { ...details, timeZone: "America/New_York" };
    expect(
      JourneyDetailsSchema.safeParse({
        ...newYork,
        start: { local: "2026-03-08T02:30", instant: "2026-03-08T07:30:00Z", offsetMinutes: -300 },
      }).success,
    ).toBe(false);
    // Both repeated minutes are valid only with an explicit matching instant and offset.
    for (const [instant, offsetMinutes] of [
      ["2026-11-01T05:30:00Z", -240],
      ["2026-11-01T06:30:00Z", -300],
    ] as const) {
      expect(
        JourneyDetailsSchema.safeParse({
          ...newYork,
          start: { local: "2026-11-01T01:30", instant, offsetMinutes },
        }).success,
      ).toBe(true);
    }
  });

  it("rejects private history/roster fields and administrator injection", () => {
    const former = {
      kind: "former",
      journeyId,
      previousPowers: powers,
      endedAt: "2026-11-03T10:00:00Z",
      endReason: "removed",
    };
    expect(FormerJourneyReferenceSchema.safeParse(former).success).toBe(true);
    expect(
      FormerJourneyReferenceSchema.safeParse({ ...former, title: "Hidden title" }).success,
    ).toBe(false);
    const self = {
      identity: { accountId: commandId, displayName: "Dev fixture" },
      membership: {
        membershipId: commandId,
        revision: 1,
        etag: '"member-1"',
        epoch: 1,
        state: "active",
        powers,
      },
    };
    expect(
      PeopleSchema.safeParse({ view: "self", self, administrator: null, items: [self] }).success,
    ).toBe(false);
    expect(
      ChangeCapabilitiesSchema.safeParse({ commandId, impactToken: "a".repeat(43), powers })
        .success,
    ).toBe(false);
    expect(
      ResolvedInvitationSchema.safeParse({ state: "authentication_required", details }).success,
    ).toBe(false);
    expect(
      ResolveInvitationSchema.safeParse({ token: "a".repeat(43), actorId: commandId }).success,
    ).toBe(false);
  });

  it("keeps pending denial distinct from completion and binds the status path", () => {
    const pending = {
      operationId: commandId,
      statusLocation: `/api/v1/operations/${commandId}`,
      status: "restricted_pending_confirmation",
      access: "denied",
      recoveryConfirmation: "pending",
      retryAfterSeconds: 5,
    };
    expect(RestrictionResultSchema.safeParse(pending).success).toBe(true);
    expect(RestrictionPendingSchema.safeParse(pending).success).toBe(true);
    expect(
      RestrictionPendingSchema.safeParse({
        ...pending,
        statusLocation: `/api/v1/operations/${journeyId}`,
      }).success,
    ).toBe(false);
    const complete = {
      operationId: commandId,
      statusLocation: `/api/v1/operations/${commandId}`,
      status: "restriction_complete",
      access: "denied",
      recoveryConfirmation: "confirmed",
    };
    expect(RestrictionCompleteSchema.safeParse(complete).success).toBe(true);
    expect(
      RestrictionCompleteSchema.safeParse({
        ...complete,
        statusLocation: `/api/v1/operations/${journeyId}`,
      }).success,
    ).toBe(false);
    expect(
      RestrictionResultSchema.safeParse({ ...pending, recoveryConfirmation: "confirmed" }).success,
    ).toBe(false);
    expect(
      RestrictionResultSchema.safeParse({
        ...pending,
        statusLocation: `/api/v1/operations/${journeyId}`,
      }).success,
    ).toBe(false);
    for (const tag of ["*", 'W/"revision"', '"first", "second"', "1"])
      expect(EntityTagSchema.safeParse(tag).success).toBe(false);
  });

  it("transports stable create identity and If-Match through the actual generated client", async () => {
    const requests: Request[] = [];
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (request) => {
        requests.push(request.clone());
        return Response.json({ code: "unavailable" }, { status: 404 });
      },
    });
    const body = CreateJourneySchema.parse({ commandId, journeyId, details });
    await client.POST("/api/v1/journeys", { body });
    await client.POST("/api/v1/journeys", { body });
    await client.PATCH("/api/v1/journeys/{id}", {
      params: { path: { id: journeyId }, header: { "if-match": '"revision_1"' } },
      body: { commandId, details },
    });
    expect(await requests[0]?.json()).toEqual(await requests[1]?.json());
    expect(requests[2]?.headers.get("If-Match")).toBe('"revision_1"');
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      "/api/v1/journeys",
      "/api/v1/journeys",
      `/api/v1/journeys/${journeyId}`,
    ]);
  });

  it("uses the selected member's opaque tag rather than the collection tag for an edit", async () => {
    const people = PeopleSchema.parse({
      view: "administration",
      items: [
        {
          identity: { accountId: commandId, displayName: "Managed member" },
          membership: {
            membershipId: commandId,
            revision: 3,
            etag: '"opaque-member-token"',
            epoch: 1,
            state: "active",
            powers,
          },
        },
      ],
      nextCursor: null,
    });
    const requests: Request[] = [];
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetch: async (request) => {
        requests.push(request.clone());
        return request.method === "GET"
          ? Response.json(people, { headers: { ETag: '"different-collection-token"' } })
          : Response.json({ code: "unavailable" }, { status: 404 });
      },
    });
    const response = await client.GET("/api/v1/journeys/{id}/people", {
      params: { path: { id: journeyId } },
    });
    if (response.data?.view !== "administration")
      throw new Error("Missing administration fixture.");
    const member = response.data.items[0]!.membership;
    await client.PUT("/api/v1/journeys/{id}/members/{memberId}/capabilities", {
      params: {
        path: { id: journeyId, memberId: member.membershipId },
        header: { "if-match": member.etag },
      },
      body: { commandId, impactToken: "a".repeat(43), powers: { coauthor: true, publisher: true } },
    });
    expect(requests[1]?.headers.get("If-Match")).toBe('"opaque-member-token"');
    expect(response.response.headers.get("ETag")).toBe('"different-collection-token"');
  });
});
