import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { importErrors, manifestErrors } from "./boundaries.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
// Use the isolated tooling compiler for AST inspection; TS7 has no legacy factory API.
const ts = createRequire(new URL("../tools/api-generation/package.json", import.meta.url))(
  "typescript",
);
/** @param {string} directory @returns {Promise<string[]>} */
async function sources(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? sources(join(directory, entry.name))
        : Promise.resolve(/\.[cm]?[jt]sx?$/.test(entry.name) ? [join(directory, entry.name)] : []),
    ),
  );
  return files.flat();
}

/** @type {import('./boundaries.mjs').Workspace[]} */
const workspaces = [];
for (const group of ["apps", "packages", "tools"]) {
  for (const entry of await readdir(join(root, group), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(root, group, entry.name);
    // Checkout sync preserves ignored outputs from other branches. A directory
    // containing only those outputs is not a workspace on this source checkpoint.
    if (!existsSync(join(directory, "package.json"))) continue;
    const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
    workspaces.push({ ...manifest, directory });
  }
}
const errors = workspaces.flatMap(manifestErrors);
for (const workspace of workspaces) {
  for (const file of await sources(join(workspace.directory, "src"))) {
    const text = await readFile(file, "utf8");
    const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    /** @param {any} node */
    function visit(node) {
      let specifier;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        specifier = node.moduleSpecifier;
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
        specifier = node.argument.literal;
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference))
        specifier = node.moduleReference.expression;
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === "require"))
      ) {
        specifier = node.arguments[0];
        if (!specifier || !ts.isStringLiteralLike(specifier))
          errors.push(`${file}: nonliteral runtime imports are forbidden`);
      }
      if (specifier && ts.isStringLiteralLike(specifier))
        errors.push(
          ...importErrors(workspace, specifier.text, file, workspaces).map(
            (error) => `${file}: ${error}`,
          ),
        );
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "PASS workspace manifests, declared runtime imports, public exports, client/server boundaries, and universal Node/React restrictions.",
  );
}
