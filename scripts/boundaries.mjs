import { isBuiltin } from "node:module";
import { resolve, relative, sep, basename } from "node:path";

const universal = [
  "@kairn/contracts",
  "@kairn/shared",
  "@kairn/sync-protocol",
  "@kairn/design-tokens",
];
export const allowedDependencies = {
  "@kairn/contracts": [],
  "@kairn/shared": [],
  "@kairn/design-tokens": [],
  "@kairn/sync-protocol": ["@kairn/contracts"],
  "@kairn/backend": ["@kairn/contracts", "@kairn/shared", "@kairn/sync-protocol"],
  "@kairn/web": universal,
  "@kairn/mobile": universal,
  "@kairn/server": [...universal, "@kairn/backend", "@kairn/web"],
  "@kairn/worker": [...universal, "@kairn/backend"],
  "@kairn/api-generation": ["@kairn/contracts"],
};

/** @typedef {{name: string, directory: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string>, exports?: Record<string, unknown>}} Workspace */
/** @param {Workspace} workspace */
export function manifestErrors(workspace) {
  const allowed = Reflect.get(allowedDependencies, workspace.name);
  if (!allowed) return [`Unknown workspace ${workspace.name}`];
  return Object.entries({ ...workspace.dependencies, ...workspace.devDependencies })
    .filter(
      ([name, version]) =>
        name.startsWith("@kairn/") && (version !== "workspace:*" || !allowed.includes(name)),
    )
    .map(([name]) => `${workspace.name} cannot depend on ${name}`);
}

/** @param {Workspace} workspace @param {string} specifier @param {string} file @param {Workspace[]} workspaces */
export function importErrors(workspace, specifier, file, workspaces) {
  if (specifier.startsWith(".")) {
    const target = resolve(file, "..", specifier);
    const ownRelative = relative(workspace.directory, target);
    if (ownRelative.startsWith(`..${sep}`) || ownRelative === "..") {
      return [`${workspace.name} uses a relative import outside its workspace: ${specifier}`];
    }
    return [];
  }
  if (isBuiltin(specifier)) {
    return [...universal, "@kairn/web", "@kairn/mobile"].includes(workspace.name)
      ? [`Node module ${specifier} is forbidden in ${workspace.name}`]
      : [];
  }
  const name = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
  if (!name) return [`Invalid import ${specifier}`];
  if (
    universal.includes(workspace.name) &&
    /^(react|react-dom|react-native)(\/|$)/.test(specifier)
  ) {
    return [`React/native import ${specifier} is forbidden in ${workspace.name}`];
  }
  const deps =
    workspace.name === "@kairn/api-generation" ||
    (workspace.name === "@kairn/server" && basename(file) === "dev.ts")
      ? { ...workspace.dependencies, ...workspace.devDependencies }
      : (workspace.dependencies ?? {});
  if (name !== workspace.name && !Object.hasOwn(deps, name))
    return [`Undeclared runtime import ${specifier} in ${workspace.name}`];
  if (!name.startsWith("@kairn/")) return [];
  const target = workspaces.find((candidate) => candidate.name === name);
  const subpath = specifier === name ? "." : `.${specifier.slice(name.length)}`;
  if (!target?.exports || !Object.hasOwn(target.exports, subpath))
    return [`Private or missing export ${specifier}`];
  if (name === "@kairn/web" && (workspace.name !== "@kairn/server" || subpath !== "./reader"))
    return [`Only the server may import @kairn/web/reader`];
  if (
    name === "@kairn/contracts" &&
    subpath === "./schema" &&
    !["@kairn/server", "@kairn/api-generation"].includes(workspace.name)
  )
    return [`Schema-generation entry is forbidden in ${workspace.name}`];
  return [];
}
