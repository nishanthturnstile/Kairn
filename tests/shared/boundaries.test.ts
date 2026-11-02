import { expect, it } from "vite-plus/test";
import { importErrors, manifestErrors } from "../../scripts/boundaries.mjs";

const web = {
  name: "@kairn/web",
  directory: "/repo/apps/web",
  dependencies: { "@kairn/contracts": "workspace:*" },
};
const server = {
  name: "@kairn/server",
  directory: "/repo/apps/server",
  dependencies: { "@kairn/web": "workspace:*" },
};
const contracts = {
  name: "@kairn/contracts",
  directory: "/repo/packages/contracts",
  exports: { ".": {}, "./client": {}, "./schema": {} },
};
const reader = {
  name: "@kairn/web",
  directory: web.directory,
  exports: { "./reader": {}, ".": {} },
};

it("rejects client-to-backend dependencies and undeclared imports", () => {
  expect(manifestErrors({ ...web, dependencies: { "@kairn/backend": "workspace:*" } })).not.toEqual(
    [],
  );
  expect(
    importErrors(web, "@kairn/backend", "/repo/apps/web/src/index.ts", [contracts]),
  ).not.toEqual([]);
});

it("blocks private exports, schema tooling in clients, and relative workspace escapes", () => {
  for (const specifier of [
    "@kairn/contracts/src/schemas",
    "@kairn/contracts/schema",
    "../../../packages/backend/src/index.js",
  ]) {
    expect(importErrors(web, specifier, "/repo/apps/web/src/index.ts", [contracts])).not.toEqual(
      [],
    );
  }
  expect(
    importErrors(web, "@kairn/contracts/client", "/repo/apps/web/src/index.ts", [contracts]),
  ).toEqual([]);
});

it("allows only the explicit server reader boundary", () => {
  expect(
    importErrors(server, "@kairn/web/reader", "/repo/apps/server/src/index.ts", [reader]),
  ).toEqual([]);
  expect(
    importErrors(server, "@kairn/web", "/repo/apps/server/src/index.ts", [reader]),
  ).not.toEqual([]);
});

it("blocks Node and React imports from universal packages", () => {
  for (const specifier of ["node:fs", "fs/promises", "react", "react-native"]) {
    expect(
      importErrors(contracts, specifier, "/repo/packages/contracts/src/index.ts", [contracts]),
    ).not.toEqual([]);
  }
});
