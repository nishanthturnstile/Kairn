// Descriptor-only boundary. Nothing here installs a handler or grants access.
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { MyAccountSchema, ProfileSchema, UpdateProfileSchema } from "./accounts.js";
import {
  ChangeCapabilitiesSchema,
  CreateInvitationSchema,
  DeleteJourneySchema,
  ImpactSchema,
  InvitationSchema,
  JourneyImpactRequestSchema,
  LifecycleCommandSchema,
  MutationResultSchema,
  ResolvedInvitationSchema,
  ResolveInvitationSchema,
} from "./access.js";
import {
  CommandSchema,
  DomainIdSchema,
  OperationStatusSchema,
  PageQuerySchema,
  ProblemDetailsSchema,
  RestrictionCompleteSchema,
  RestrictionPendingSchema,
  RevisionHeadersSchema,
} from "./common.js";
import {
  CreateJourneySchema,
  JourneyHistoryQuerySchema,
  JourneyHistorySchema,
  JourneySummarySchema,
  PeopleSchema,
  UpdateJourneySchema,
} from "./journeys.js";

const names = new Map<z.ZodType, string>([
  [MyAccountSchema, "MyAccount"],
  [ProfileSchema, "Profile"],
  [UpdateProfileSchema, "UpdateProfile"],
  [JourneySummarySchema, "JourneySummary"],
  [JourneyHistorySchema, "JourneyHistory"],
  [CreateJourneySchema, "CreateJourney"],
  [UpdateJourneySchema, "UpdateJourney"],
  [PeopleSchema, "People"],
  [CreateInvitationSchema, "CreateInvitation"],
  [InvitationSchema, "Invitation"],
  [ResolveInvitationSchema, "ResolveInvitation"],
  [ResolvedInvitationSchema, "ResolvedInvitation"],
  [CommandSchema, "Command"],
  [ChangeCapabilitiesSchema, "ChangeCapabilities"],
  [JourneyImpactRequestSchema, "JourneyImpactRequest"],
  [ImpactSchema, "JourneyImpact"],
  [LifecycleCommandSchema, "LifecycleCommand"],
  [DeleteJourneySchema, "DeleteJourney"],
  [OperationStatusSchema, "OperationStatus"],
  [RestrictionCompleteSchema, "RestrictionComplete"],
  [RestrictionPendingSchema, "RestrictionPending"],
]);
export function json<S extends z.ZodType>(schema: S, explicitName?: string) {
  const name = explicitName ?? names.get(schema);
  const copy = schema.clone();
  return { "application/json": { schema: name ? copy.openapi(name) : copy } };
}
export const privateHeaders = {
  "Cache-Control": { schema: { type: "string", const: "no-store" } },
} as const;
export const versionedHeaders = {
  ...privateHeaders,
  ETag: { description: "Current opaque strong entity tag.", schema: { type: "string" } },
} as const;
const failure = {
  description: "Safe RFC 9457 domain failure.",
  content: {
    "application/problem+json": { schema: ProblemDetailsSchema.clone().openapi("ProblemDetails") },
  },
  headers: privateHeaders,
};
export const failures = {
  400: failure,
  401: failure,
  403: failure,
  404: failure,
  409: failure,
  412: failure,
  413: failure,
  429: failure,
  503: failure,
};
export function readResponses<S extends z.ZodType>(schema: S, name?: string) {
  return {
    200: {
      description: "Current permitted projection.",
      content: json(schema, name),
      headers: versionedHeaders,
    },
    ...failures,
  };
}
export function body<S extends z.ZodType>(schema: S) {
  return { required: true, content: json(schema) };
}
const journeyParams = z.object({ id: DomainIdSchema });
const invitationParams = journeyParams.extend({ inviteId: DomainIdSchema });
export const restrictionResponses = {
  200: {
    description: "Restriction independently confirmed; cleanup is separate.",
    content: json(RestrictionCompleteSchema),
    headers: privateHeaders,
  },
  202: {
    description: "Local access denied; independent confirmation pending.",
    content: json(RestrictionPendingSchema),
    headers: {
      ...privateHeaders,
      "Retry-After": { schema: { type: "integer", minimum: 5, maximum: 30 } },
    },
  },
  ...failures,
} as const;

export const accountJourneyRoutes = [
  createRoute({
    method: "get",
    path: "/api/v1/me",
    operationId: "getMyAccount",
    responses: readResponses(MyAccountSchema),
  }),
  createRoute({
    method: "patch",
    path: "/api/v1/me/profile",
    operationId: "updateMyProfile",
    request: { headers: RevisionHeadersSchema, body: body(UpdateProfileSchema) },
    responses: readResponses(ProfileSchema),
  }),
  createRoute({
    method: "get",
    path: "/api/v1/me/journeys",
    operationId: "listMyJourneys",
    request: { query: JourneyHistoryQuerySchema },
    responses: readResponses(JourneyHistorySchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys",
    operationId: "createJourney",
    request: { body: body(CreateJourneySchema) },
    responses: {
      ...readResponses(JourneySummarySchema),
      201: {
        description: "Canonical journey and creator membership committed once.",
        content: json(JourneySummarySchema),
        headers: versionedHeaders,
      },
    },
  }),
  createRoute({
    method: "get",
    path: "/api/v1/journeys/{id}",
    operationId: "getJourneySummary",
    request: { params: journeyParams },
    responses: readResponses(JourneySummarySchema),
  }),
  createRoute({
    method: "patch",
    path: "/api/v1/journeys/{id}",
    operationId: "updateJourneyDetails",
    request: {
      params: journeyParams,
      headers: RevisionHeadersSchema,
      body: body(UpdateJourneySchema),
    },
    responses: readResponses(JourneySummarySchema),
  }),
  createRoute({
    method: "get",
    path: "/api/v1/journeys/{id}/people",
    operationId: "getJourneyPeople",
    request: { params: journeyParams, query: PageQuerySchema },
    responses: readResponses(PeopleSchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/invitations",
    operationId: "createInvitation",
    request: {
      params: journeyParams,
      headers: RevisionHeadersSchema,
      body: body(CreateInvitationSchema),
    },
    responses: {
      201: {
        description: "New offer queued; joining still requires explicit recipient acceptance.",
        content: json(InvitationSchema),
        headers: versionedHeaders,
      },
      ...failures,
    },
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/invitations/{inviteId}/resend",
    operationId: "resendInvitation",
    request: {
      params: invitationParams,
      headers: RevisionHeadersSchema,
      body: body(CommandSchema),
    },
    responses: readResponses(InvitationSchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/invitations/{inviteId}/revoke",
    operationId: "revokeInvitation",
    request: {
      params: invitationParams,
      headers: RevisionHeadersSchema,
      body: body(CommandSchema),
    },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/invitations/resolve",
    operationId: "resolveInvitation",
    request: { body: body(ResolveInvitationSchema) },
    responses: readResponses(ResolvedInvitationSchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/invitations/{id}/accept",
    operationId: "acceptInvitation",
    request: { params: journeyParams, headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: readResponses(JourneySummarySchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/invitations/{id}/decline",
    operationId: "declineInvitation",
    request: { params: journeyParams, headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "put",
    path: "/api/v1/journeys/{id}/members/{memberId}/capabilities",
    operationId: "replaceMemberCapabilities",
    request: {
      params: journeyParams.extend({ memberId: DomainIdSchema }),
      headers: RevisionHeadersSchema,
      body: body(ChangeCapabilitiesSchema),
    },
    responses: {
      ...restrictionResponses,
      200: {
        description: "Accepted expansion or confirmed restriction.",
        content: json(z.union([MutationResultSchema, RestrictionCompleteSchema])),
        headers: versionedHeaders,
      },
    },
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/lifecycle/impact",
    operationId: "previewJourneyImpact",
    request: {
      params: journeyParams,
      headers: RevisionHeadersSchema,
      body: body(JourneyImpactRequestSchema),
    },
    responses: readResponses(ImpactSchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/leave",
    operationId: "leaveJourney",
    request: {
      params: journeyParams,
      headers: RevisionHeadersSchema,
      body: body(LifecycleCommandSchema),
    },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/archive",
    operationId: "archiveJourney",
    request: {
      params: journeyParams,
      headers: RevisionHeadersSchema,
      body: body(LifecycleCommandSchema),
    },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/deletion",
    operationId: "deleteJourney",
    request: {
      params: journeyParams,
      headers: RevisionHeadersSchema,
      body: body(DeleteJourneySchema),
    },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "get",
    path: "/api/v1/operations/{id}",
    operationId: "getOperationStatus",
    request: { params: journeyParams },
    responses: readResponses(OperationStatusSchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/operations/{id}/retry",
    operationId: "retryRestrictionConfirmation",
    request: { params: journeyParams, body: body(CommandSchema) },
    responses: restrictionResponses,
  }),
];
