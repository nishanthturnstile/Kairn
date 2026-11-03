import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import {
  AccountDataExportSchema,
  AvatarStatusSchema,
  AvatarUploadResultSchema,
  AvatarUploadSchema,
} from "./accounts.js";
import { InvitationSchema, LifecycleCommandSchema, MutationResultSchema } from "./access.js";
import {
  CommandSchema,
  DomainIdSchema,
  PageQuerySchema,
  RestrictionCompleteSchema,
  RevisionHeadersSchema,
} from "./common.js";
import {
  AccountDeletionImpactSchema,
  AcceptTransferSchema,
  DeleteAccountSchema,
  JourneyAccessSchema,
  MarkNoticeReadSchema,
  NoticePageSchema,
  OfferTransferSchema,
  TransferListSchema,
  TransferSchema,
} from "./lifecycle.js";
import {
  ApproveExportSchema,
  ChangeSourceGrantSchema,
  CreateExportRequestSchema,
  ExportGrantPageSchema,
  ExportGrantSchema,
  ExportRequestPageSchema,
  ExportRequestSchema,
  SourceGrantSchema,
} from "./grants.js";
import {
  body,
  failures,
  json,
  privateHeaders,
  readResponses,
  restrictionResponses,
  versionedHeaders,
} from "./routes.js";

const id = z.object({ id: DomainIdSchema });
const transfer = id.extend({ transferId: DomainIdSchema });
const source = id.extend({ journeyId: DomainIdSchema });
const upload = z.object({ uploadId: DomainIdSchema });
const image = z.string().openapi({ type: "string", format: "binary" });
const imageResponses = {
  200: {
    description: "Current authorized sanitized avatar bytes.",
    headers: privateHeaders,
    content: { "image/jpeg": { schema: image }, "image/png": { schema: image } },
  },
  ...failures,
};
const grantResponses = {
  ...restrictionResponses,
  200: {
    description: "Accepted current grant or confirmed restriction.",
    headers: versionedHeaders,
    content: json(
      z.union([SourceGrantSchema, MutationResultSchema, RestrictionCompleteSchema]),
      "SourceGrantMutation",
    ),
  },
};

// Contracts only. Full source/export and identity-media routes activate with real resources/services.
export const extendedAccountJourneyRoutes = [
  createRoute({
    method: "get",
    path: "/api/v1/me/export",
    operationId: "exportMyAccountData",
    responses: readResponses(AccountDataExportSchema, "AccountDataExport"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/me/avatar/uploads",
    operationId: "beginAvatarUpload",
    request: { body: body(AvatarUploadSchema) },
    responses: {
      201: {
        description: "Bounded authenticated upload reserved.",
        content: json(AvatarUploadResultSchema, "AvatarUpload"),
        headers: privateHeaders,
      },
      ...failures,
    },
  }),
  createRoute({
    method: "put",
    path: "/api/v1/me/avatar/uploads/{uploadId}/bytes",
    operationId: "writeAvatarUpload",
    request: {
      params: upload,
      body: {
        required: true,
        content: { "image/jpeg": { schema: image }, "image/png": { schema: image } },
      },
    },
    responses: readResponses(MutationResultSchema),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/me/avatar/uploads/{uploadId}/complete",
    operationId: "completeAvatarUpload",
    request: { params: upload, body: body(CommandSchema) },
    responses: readResponses(AvatarStatusSchema, "AvatarStatus"),
  }),
  createRoute({
    method: "get",
    path: "/api/v1/me/avatar",
    operationId: "readMyAvatar",
    responses: imageResponses,
  }),
  createRoute({
    method: "delete",
    path: "/api/v1/me/avatar",
    operationId: "removeMyAvatar",
    request: { headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/me/deletion/impact",
    operationId: "previewAccountDeletion",
    request: {
      query: PageQuerySchema,
      headers: RevisionHeadersSchema,
      body: body(z.strictObject({})),
    },
    responses: readResponses(AccountDeletionImpactSchema, "AccountDeletionImpact"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/me/deletion",
    operationId: "deleteMyAccount",
    request: { headers: RevisionHeadersSchema, body: body(DeleteAccountSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "get",
    path: "/api/v1/me/notices",
    operationId: "listMyNotices",
    request: { query: PageQuerySchema },
    responses: readResponses(NoticePageSchema, "NoticePage"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/me/notices/{id}/read",
    operationId: "markNoticeRead",
    request: { params: id, body: body(MarkNoticeReadSchema) },
    responses: readResponses(MutationResultSchema),
  }),
  createRoute({
    method: "get",
    path: "/api/v1/journeys/{id}/access",
    operationId: "getJourneyAccess",
    request: { params: id },
    responses: readResponses(JourneyAccessSchema, "JourneyAccess"),
  }),
  createRoute({
    method: "get",
    path: "/api/v1/journeys/{id}/invitations",
    operationId: "listInvitations",
    request: { params: id, query: PageQuerySchema },
    responses: readResponses(
      z.strictObject({
        items: z.array(InvitationSchema).max(100),
        nextCursor: PageQuerySchema.shape.cursor.unwrap().nullable(),
      }),
      "InvitationPage",
    ),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/members/{memberId}/remove",
    operationId: "removeJourneyMember",
    request: {
      params: id.extend({ memberId: DomainIdSchema }),
      headers: RevisionHeadersSchema,
      body: body(LifecycleCommandSchema),
    },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "get",
    path: "/api/v1/journeys/{id}/transfers",
    operationId: "listAdministrationTransfers",
    request: { params: id, query: PageQuerySchema },
    responses: readResponses(TransferListSchema, "TransferPage"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/transfers",
    operationId: "offerAdministrationTransfer",
    request: { params: id, headers: RevisionHeadersSchema, body: body(OfferTransferSchema) },
    responses: {
      201: {
        description: "Offer pending explicit target acceptance.",
        content: json(TransferSchema, "Transfer"),
        headers: versionedHeaders,
      },
      ...failures,
    },
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/transfers/{transferId}/accept",
    operationId: "acceptAdministrationTransfer",
    request: { params: transfer, headers: RevisionHeadersSchema, body: body(AcceptTransferSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/transfers/{transferId}/decline",
    operationId: "declineAdministrationTransfer",
    request: { params: transfer, headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/transfers/{transferId}/cancel",
    operationId: "cancelAdministrationTransfer",
    request: { params: transfer, headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "get",
    path: "/api/v1/sources/{id}/journeys/{journeyId}/grant",
    operationId: "getSourceGrant",
    request: { params: source },
    responses: readResponses(SourceGrantSchema, "SourceGrant"),
  }),
  createRoute({
    method: "put",
    path: "/api/v1/sources/{id}/journeys/{journeyId}/grant",
    operationId: "changeSourceGrant",
    request: {
      params: source,
      headers: RevisionHeadersSchema,
      body: body(ChangeSourceGrantSchema),
    },
    responses: grantResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/sources/{id}/journeys/{journeyId}/withdrawal",
    operationId: "withdrawSourceGrant",
    request: { params: source, headers: RevisionHeadersSchema, body: body(LifecycleCommandSchema) },
    responses: restrictionResponses,
  }),
  createRoute({
    method: "post",
    path: "/api/v1/journeys/{id}/original-export-requests",
    operationId: "requestOriginalExport",
    request: { params: id, body: body(CreateExportRequestSchema) },
    responses: {
      201: {
        description: "Request is not byte-delivery authority.",
        content: json(ExportRequestSchema, "ExportRequest"),
        headers: versionedHeaders,
      },
      ...failures,
    },
  }),
  createRoute({
    method: "get",
    path: "/api/v1/me/original-export-requests",
    operationId: "listMyOriginalExportRequests",
    request: { query: PageQuerySchema },
    responses: readResponses(ExportRequestPageSchema, "ExportRequestPage"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/original-export-requests/{id}/approve",
    operationId: "approveOriginalExport",
    request: { params: id, headers: RevisionHeadersSchema, body: body(ApproveExportSchema) },
    responses: readResponses(ExportGrantSchema, "ExportGrant"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/original-export-requests/{id}/decline",
    operationId: "declineOriginalExport",
    request: { params: id, headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: readResponses(MutationResultSchema),
  }),
  createRoute({
    method: "get",
    path: "/api/v1/journeys/{id}/original-export-grants",
    operationId: "listOriginalExportGrants",
    request: { params: id, query: PageQuerySchema },
    responses: readResponses(ExportGrantPageSchema, "ExportGrantPage"),
  }),
  createRoute({
    method: "post",
    path: "/api/v1/original-export-grants/{id}/revocation",
    operationId: "revokeOriginalExport",
    request: { params: id, headers: RevisionHeadersSchema, body: body(CommandSchema) },
    responses: restrictionResponses,
  }),
];
