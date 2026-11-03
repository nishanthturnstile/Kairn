import { describe, expect, test } from "vite-plus/test";
import {
  controller as web,
  initialState as webInitial,
  project as webProject,
} from "../../apps/web/src/prototype/controller.js";
import {
  controller as native,
  initialState as nativeInitial,
  project as nativeProject,
} from "../../apps/mobile/src/prototype/controller.js";
import type { Action } from "../../apps/web/src/prototype/controller.js";
import vectors from "../fixtures/prototype/vectors.json" with { type: "json" };
import manifest from "../fixtures/prototype/continuations.json" with { type: "json" };

describe("canonical sample transitions on both app boundaries", () => {
  test("withdrawal starts with accessible dependents", () => {
    for (const output of [
      webProject(webInitial("published-v1")),
      nativeProject(nativeInitial("published-v1")),
    ]) {
      expect(output.eligibleHighlightIds).toEqual(["highlight-1"]);
      expect(output.validAnswerIds).toEqual(["answer-1"]);
    }
  });
  for (const vector of vectors)
    test(vector.name, () => {
      // Validate fixture actions at the TypeScript boundary; the data is reviewed JSON.
      const actions = vector.actions as Action[];
      const webState = actions.reduce(web, webInitial(vector.scenario));
      const nativeState = actions.reduce(native, nativeInitial(vector.scenario));
      expect(webProject(webState)).toMatchObject(vector.expected);
      expect(nativeProject(nativeState)).toEqual(webProject(webState));
      expect(webState.data.actors.filter((actor) => actor.admin)).toHaveLength(1);
    });
  test("named continuation preserves identity, content and scope", () => {
    const checkpoint = manifest[0]!;
    for (const output of [
      webProject(webInitial(checkpoint.web)),
      nativeProject(nativeInitial(checkpoint.web)),
    ]) {
      expect(output.journeyId).toBe(checkpoint.journeyId);
      expect(output.continuation).toMatchObject({
        sourceId: checkpoint.sourceId,
        content: checkpoint.content,
        scope: checkpoint.scope,
      });
    }
  });
  test("all forward and reverse checkpoints match the manifest", () => {
    for (const checkpoint of manifest) {
      for (const start of [webInitial(checkpoint.web), nativeInitial(checkpoint.native)]) {
        const source = start.data.moments.find((item) => item.id === checkpoint.sourceId)!;
        const actor = start.data.actors.find((item) => item.id === start.actorId)!;
        expect(start.data.version).toBe(checkpoint.fixtureVersion);
        expect(start.journeyId).toBe(checkpoint.journeyId);
        expect(actor.id).toBe(checkpoint.actor);
        expect({
          admin: actor.admin,
          coauthor: actor.coauthor,
          publisher: actor.publisher,
        }).toEqual(checkpoint.powers);
        expect(source).toMatchObject({ content: checkpoint.content, scope: checkpoint.scope });
        expect(start.data.approved.revision).toBe(checkpoint.approvedRevision);
      }
    }
  });
});
