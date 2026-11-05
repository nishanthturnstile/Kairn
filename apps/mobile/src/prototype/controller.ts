import seed from "./generated/seed.json" with { type: "json" };
import continuations from "./generated/continuations.json" with { type: "json" };

// The fixture is JSON-only. Use the same clone boundary on Hermes and browsers.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export type Scope = "only-me" | "journey-review" | "publication";
export type Action =
  | { type: "reset"; scenario: string }
  | { type: "actor"; id: string }
  | { type: "create"; title: string }
  | { type: "join"; code: string }
  | { type: "revisit" }
  | { type: "scope"; scope: Scope }
  | { type: "caption"; caption: string }
  | { type: "withdraw"; sourceId: string };
export function initialState(scenario = "first-run") {
  const data = clone(seed);
  const first = scenario === "first-run";
  if (scenario === "withdrawn-source" || scenario === "native-highlights-withdrawn") {
    data.moments[17]!.scope = "only-me";
    data.moments[17]!.withdrawn = true;
  }
  if (scenario === "review-moment-19" || scenario === "capture-and-contribute")
    data.moments[18]!.scope = "journey-review";
  if (scenario === "published-v1" || scenario === "native-highlights-v1") {
    data.highlights = [{ id: "highlight-1", sourceId: "sample-moment-3" }];
    data.answers = [
      {
        id: "answer-1",
        sourceIds: ["sample-moment-3"],
        text: "Prepared answer linked to the approved source.",
      },
    ];
  }
  return {
    scenario,
    actorId:
      scenario === "review-moment-19" || scenario === "capture-and-contribute"
        ? "dev"
        : scenario === "withdrawn-source" || scenario === "native-highlights-withdrawn"
          ? "eli"
          : "mira",
    joined: !first,
    journeyId: first ? null : (seed.journey.id as string | null),
    title: seed.journey.title,
    notice: "Sample only. Reload or reset clears changes.",
    data,
  };
}
export type SampleState = ReturnType<typeof initialState>;
export function controller(state: SampleState, action: Action): SampleState {
  if (action.type === "reset") return initialState(action.scenario);
  const next = clone(state);
  const actor = next.data.actors.find((item) => item.id === next.actorId)!;
  switch (action.type) {
    case "actor":
      if (!next.data.actors.some((item) => item.id === action.id)) return state;
      next.actorId = action.id;
      // Administrator-only variant moves the single administrator assignment.
      next.data.actors.forEach((item) => {
        item.admin = item.id === (action.id === "asha" ? "asha" : "mira");
      });
      break;
    case "create":
      if (!action.title.trim()) {
        next.notice = "Enter a journey title.";
        break;
      }
      next.title = action.title.trim();
      next.journeyId = seed.journey.id;
      next.joined = true;
      next.actorId = "mira";
      next.notice = "Sample journey created. Nothing was sent to a service.";
      break;
    case "join":
      if (action.code.trim().toUpperCase() !== "RIDGE") {
        next.notice = "That sample invite is invalid. Use RIDGE.";
        break;
      }
      next.joined = true;
      next.journeyId = seed.journey.id;
      next.notice = "Joined the sample journey. Your gallery remains private.";
      break;
    case "revisit":
      next.notice = next.joined
        ? "Reopened the same sample journey."
        : "Create or join the sample journey first.";
      break;
    case "scope": {
      const source = next.data.moments.find((item) => item.id === "sample-moment-19")!;
      if (source.owner !== actor.id) {
        next.notice = "Only the source owner can change this permission.";
        break;
      }
      source.scope = action.scope;
      next.notice = "Sample permission updated. Original-file export is separate.";
      break;
    }
    case "caption":
      if (!actor.member || !actor.coauthor) {
        next.notice = "Coauthor power is required.";
        break;
      }
      next.data.draft.caption = action.caption;
      next.data.draft.revision += 1;
      break;
    case "withdraw": {
      const source = next.data.moments.find((item) => item.id === action.sourceId);
      if (!source || source.owner !== actor.id) {
        next.notice = "Only the source owner can withdraw this source.";
        break;
      }
      source.withdrawn = true;
      source.scope = "only-me";
      next.data.approved.sourceIds = next.data.approved.sourceIds.filter((id) => id !== source.id);
      next.notice = "Sample access removed. Downloaded copies cannot be recalled.";
      break;
    }
  }
  return next;
}
export function project(state: SampleState) {
  const actor = state.data.actors.find((item) => item.id === state.actorId)!;
  const eligible = (id: string) =>
    state.data.moments.some(
      (item) => item.id === id && item.scope === "publication" && item.rights && !item.withdrawn,
    );
  const source = state.data.moments.find((item) => item.id === "sample-moment-19")!;
  const canReview = state.joined && actor.member && (actor.coauthor || actor.publisher);
  return {
    journeyId: state.journeyId,
    joined: state.joined,
    actorId: actor.id,
    administrator: state.data.actors.find((item) => item.admin)!.id,
    canReview,
    visibleMoments:
      state.joined && actor.member
        ? state.data.moments.filter(
            (item) =>
              item.owner === actor.id || (canReview && item.scope !== "only-me" && !item.withdrawn),
          )
        : [],
    canViewContinuation: actor.id === source.owner || (canReview && source.scope !== "only-me"),
    canEdit: state.joined && actor.member && actor.coauthor,
    canPublish: state.joined && actor.member && actor.publisher,
    draft: canReview ? state.data.draft : null,
    approved: { ...state.data.approved, sourceIds: state.data.approved.sourceIds.filter(eligible) },
    continuation: {
      sourceId: source.id,
      content: source.content,
      scope: source.scope,
      eligible: eligible(source.id),
    },
    eligibleHighlightIds: state.data.highlights
      .filter((item) => eligible(item.sourceId))
      .map((item) => item.id),
    validAnswerIds: state.data.answers
      .filter((item) => item.sourceIds.every(eligible))
      .map((item) => item.id),
    notice: state.notice,
  };
}
export { seed, continuations };
