# Repository toolchain findings

Research date: 1 November 2026. Scope: workspace, web and Node build tooling. This report supports [the research plan](research_plan.md) and preserves [architecture section 14](../../core/architecture.md#14-canonical-stack-and-dependency-register) as the selected dependency register. No application dependencies were installed or built.

## Summary

Keep one pnpm workspace and Vite+ as the JavaScript toolchain. Use `vp build` for browser and public-reader SSR artifacts, `vp pack` for compiled shared packages and Node process entries, and package scripts driven by `vp run` for orchestration. Metro and Gradle remain native tools.

Prefer compiled ESM plus declaration files for all five shared packages. This gives the browser bundler, Metro, Node, and both TypeScript versions the same package entry. The cost is an initial package build and watch task before app development. The alternative, exporting TypeScript sources to bundlers and compiled JavaScript to Node through conditional exports, adds multiple resolution paths before the project needs them.

High-confidence metadata observations support the existing version pins. End-to-end resolution, declaration compatibility, plugin integration, and production artifact behavior remain implementation acceptance gates.

## Stack

The official npm metadata for `vite-plus@1.4.0`, `@voidzero-dev/vite-plus-core@1.4.0`, `@vitejs/plugin-react@6.1.2`, and `pnpm@12.16.1` exists and agrees with the architecture baseline. The Vite+ tarball's `dist/versions.js` reports Vite `8.3.5`, Rolldown `1.2.15`, Vitest `5.0.5`, Oxlint `1.89.0`, Oxfmt `0.74.0`, TypeScript Go integration `7.0.2004`, and tsdown `0.23.1`.

Vite+ requires Node `^22.18.0 || ^24.11.0 || >=26.0.0`; the baseline Node `26.13.0` meets that requirement. The React plugin declares Vite `^8.0.0`, while the aliased core is versioned `1.4.0`. These are different version identities, so raw peer matching alone cannot certify the integration. [Vite+ metadata](https://registry.npmjs.org/vite-plus/1.4.0), [core metadata](https://registry.npmjs.org/%40voidzero-dev%2Fvite-plus-core/1.4.0), [React plugin metadata](https://registry.npmjs.org/%40vitejs%2Fplugin-react/6.1.2), [pnpm metadata](https://registry.npmjs.org/pnpm/12.16.1).

## Existing patterns

The repository has planning documents but no package manifests, workspace file, lockfile, application entries, or CI configuration. Architecture section 5.2 already defines four applications and five packages. Reuse those names. Keep application-specific UI in each app and share framework-free rules and contracts.

Do not introduce Turbo, standalone Vitest, ESLint, Prettier, tsup, or a second test stack. Vite+ already covers the selected build/check/test/task roles.

## Integration points

### Workspace installation and command ownership

Pin `vite-plus` locally in development dependencies and commit `pnpm-lock.yaml`. Contributors run package scripts through the pinned package manager or `pnpm exec vp`; a global Vite+ installation is optional. The local CLI supports tasks, package management, builds, checks, tests, and packing, but machine-level `vp env` operations require the global CLI. Root scripts must not depend on a contributor's global tool installation. [Project-local CLI](https://viteplus.dev/guide/local-cli).

Use `pnpm-workspace.yaml` with `apps/*` and `packages/*`. Explicit `workspace:*` dependencies fail when the intended local package is absent rather than falling back to the registry. pnpm 12 puts structural settings in this YAML file. `.npmrc` reads only authentication, registry, TLS, proxy, and local-address settings. Keep one shared lockfile and declare dependencies where code imports them. [pnpm workspaces](https://pnpm.io/workspaces), [pnpm settings](https://pnpm.io/settings).

Keep the official compatibility overrides together with Vite+ upgrades:

```yaml
overrides:
  vite@*: npm:@voidzero-dev/vite-plus-core@1.4.0
  vitest@*: 5.0.5
```

These overrides ensure plugins and tests use the same Vite and Vitest internals as Vite+. Read the actual generator output and resolved graph before accepting peer rules. [Vite+ local installation](https://viteplus.dev/guide/local-cli).

pnpm's `strictPeerDependencies` defaults to false. Use an explicit project policy. Missing optional peers can resolve from other workspace projects, including development dependencies. The documented way to prevent that behavior is to disable both `autoInstallPeers` and `dedupePeerDependents`. This requires explicitly declaring required peers and inspecting the resulting graph. The choice fits this repository's web/native separation but needs qualification with Expo tooling. `peerDependencyRules` remains backward compatible but is deprecated and changes mismatch reporting rather than peer resolution. Keep any Vite alias exception narrow and documented. [pnpm peer settings](https://pnpm.io/settings/peer-dependencies).

### Task names and dependency order

`vp dev` invokes the built-in web server. `vp run dev` invokes the project's named task or script. The distinction also applies to build, test, check, and pack. Use public root scripts for contributors, with Vite Task dispatch behind them.

Useful supported commands include:

```sh
pnpm exec vp run -r build
pnpm exec vp run -t @kairn/server#build
pnpm exec vp run --filter @kairn/web --fail-if-no-match build
```

Recursive tasks run in workspace dependency order. Transitive mode includes the target package and its dependencies. Name or directory filters support pnpm selection syntax. A missing filter match otherwise only warns and exits successfully. Package relationships belong in ordinary `package.json` dependencies; use explicit task dependencies for artifact relationships that are not runtime imports. [Vite+ run guide](https://viteplus.dev/guide/run).

Do not define the same task name in both `package.json` and `vite.config.ts`. Configuration tasks require `command`; `dependsOn` accepts `package#task` names or dependency-task objects. Package scripts are uncached by default, configuration tasks are cached by default. Set development, integration, provider, and native-build tasks to `cache: false` initially.

For deterministic JavaScript builds, retain automatic input discovery and declare `dist/**` outputs when needed. Custom generators must include schemas, templates, configuration, and relevant environment inputs. A cache hit must restore missing outputs, not only replay logs. Shared inputs can use `{ pattern: '...', base: 'workspace' }`. Verify invalidation by changing a contract and a relevant public configuration value. [Vite Task configuration](https://viteplus.dev/config/run).

### Compiled package boundary

`vp pack` uses bundled tsdown and supports ESM, source maps, and declarations. Configure it in `vite.config.ts` under `pack`, with `dts: true` for packages. Node process entries can omit declarations. `vp build` handles the web application and SSR builds. Do not add a direct tsdown installation for the same work. [Vite+ pack](https://viteplus.dev/guide/pack), [pack configuration](https://viteplus.dev/config/pack).

Recommend `type: module`, explicit package export maps, `dist/index.js`, and `dist/index.d.ts` for shared packages. Add only deliberate public subpaths. Export maps define a package's public entry points and block unsupported deep imports. They also let Node resolve JavaScript directly without TypeScript loaders. [Node package entry points](https://nodejs.org/api/packages.html#package-entry-points).

tsdown externalizes declared production dependencies, peer dependencies, and optional dependencies by default. Development and undeclared dependencies can be bundled when imported. Therefore compiled Node artifacts need their production dependency graph and built workspace packages present at runtime. A single generated `dist/index.js` is not automatically a self-contained release. Explicitly externalize native modules and Node builtins, keep development imports out of runtime code, and verify final package resolution in a clean production layout. [tsdown dependency handling](https://tsdown.dev/options/dependencies).

Declaration generation requires TypeScript. `dts: true` or `--dts` explicitly enables it, while a package `types` entry may enable it implicitly. Prefer an explicit setting. Generated universal declarations must pass both the root compiler and the mobile compiler. `skipLibCheck` must not hide incompatible first-party declarations. The current tsdown documentation describes `0.23.4`; Vite+ bundles `0.23.1`, so option details require a real pinned-tool build. [tsdown declarations](https://tsdown.dev/options/dts).

### Static checks with the mobile compiler exception

Root `vp check` combines format, lint, and TypeScript diagnostics when `lint.options.typeAware` and `typeCheck` are both true. It always uses root lint and format settings, including when launched from an app directory. A mobile package config cannot disable these options for `vp check`. [Vite+ checks](https://viteplus.dev/guide/check).

The type-aware engine uses TypeScript Go. Oxlint documents type options at the root configuration level, while per-file overrides cover rules, environments, globals, and plugins. They do not select a different TypeScript engine. No documented negating `--no-type-aware` or `--no-type-check` flags were found. [Vite+ lint](https://viteplus.dev/guide/lint), [Oxlint configuration](https://oxc.rs/docs/guide/usage/linter/config.html), [Oxlint CLI](https://oxc.rs/docs/guide/usage/linter/cli.html).

Use separate commands rather than assuming one root type-checker proves SDK-compatible native types. The following are proposed command shapes for the implementation, with all directories created before use:

```sh
pnpm exec vp fmt --check .
pnpm exec vp check --no-fmt apps/web apps/server apps/worker packages tools scripts config vite.config.ts
pnpm exec vp lint --config config/mobile-lint/vite.config.ts apps/mobile
pnpm --filter @kairn/mobile exec tsc --noEmit
```

The explicit mobile lint config imports shared rules and sets `typeAware: false` and `typeCheck: false`. An explicit `vp lint --config` selects a separate config; `vp check` does not provide this package override behavior. Keep the root TypeScript project graph free of references into mobile. Apply the root formatter to mobile with the rest of the repo. The mobile package's local TypeScript selection supplies native compiler diagnostics. [Explicit lint configuration](https://viteplus.dev/config/lint), [format commands](https://viteplus.dev/guide/fmt).

This split is a recommendation derived from documented tool behavior. Verify it by introducing a temporary native-only type error and confirming that the mobile compiler rejects it. Also prove that root checks never substitute TypeScript Go for the mobile compiler.

## Gotchas

| Issue | Consequence | Setup response |
|---|---|---|
| Vite alias version differs from plugin's Vite peer major | A strict install may reject the graph despite the supported alias convention. | Preserve narrow Vite compatibility reporting and verify plugin integration with the actual build. |
| `openapi-typescript@7.13.0` declares TypeScript `^5.x` | Its shipped code calls legacy APIs absent from TypeScript 7, while follow-up tests pass on TypeScript 6. | Use pinned TypeScript 6.0.3 in the generation workspace with a narrow tested peer adjustment. Actual project schemas still need regression coverage. |
| Native type checking accidentally uses root configuration | A green check may not establish Expo SDK compatibility. | Use the explicit lint and local-compiler split above. |
| `baseUrl` in inherited tsconfig | Shipped Vite+ warns that type-aware/type-check support is skipped for unsupported baseUrl projects. | Use workspace packages and explicit relative paths. Do not add baseUrl merely to shorten imports. |
| Broad task caching includes integration or native builds | Old logs or artifacts may look like current qualification. | Cache deterministic JavaScript work first. Run integration and native evidence uncached. |
| Compiled package exports point at absent dist files | App development or direct Node startup fails after clean install. | Build dependency packages before apps and watch packages during development. |
| pnpm dependency install scripts are not reviewed | Installation can fail under strict build policy. | Use the current `allowBuilds` policy with explicitly reviewed dependencies. Do not enable every dependency script. |

The OpenAPI peer finding was confirmed from [package metadata](https://registry.npmjs.org/openapi-typescript/7.13.0). Subsequent source inspection and an [isolated expression probe](compiler_api_evidence.json) establish that this is also an actual compiler API mismatch. The `baseUrl` warning was observed in the official `vite-plus@1.4.0` tarball. pnpm documents `allowBuilds` and `strictDepBuilds` in its [build settings](https://pnpm.io/settings/build).

## Testing

The repository setup acceptance suite should prove the following against the actual generated repository:

1. A clean frozen-lockfile install resolves only intentional peers and build hooks.
2. Every universal package emits JavaScript and declarations that both compilers consume.
3. Vite resolves one supported core identity and the matching bundled Vitest internals.
4. Browser, public SSR, server, and worker artifacts build and start from their documented output layout.
5. Changing a shared contract rebuilds affected consumers, while cache restoration recreates deleted outputs.
6. Server-only imports fail the client dependency-boundary check, including relative-path bypasses.
7. Root static checks, explicit mobile lint, and mobile TypeScript fail on representative introduced errors.

A successful version-metadata fetch does not establish any of these outcomes. No application build or test was possible in this documentation-only repository.

## Open questions

The setup can use the existing working repository name and `@kairn/*` as private package names. Final Android identity, distribution ownership, and CI hosting belong in the synthesis plan. The stack itself does not need another selection round.

The synthesis resolves the compiler choice through a tooling-only TypeScript 6.0.3 workspace. Follow-up [CLI/API execution and cross-consumer checks](findings_typescript6.md) passed and supersede the original TypeScript 5 recommendation. Regress the actual project schema during implementation. The source-export versus compiled-export decision uses the compiled recommendation; revisit source conditions only after build/watch overhead proves material.

## Sources

All external sources below are Tier 1 maintainer documentation or official package metadata. Observed on 1 November 2026.

- VoidZero, Vite+ 1.4.0: [package metadata and tarball pointer](https://registry.npmjs.org/vite-plus/1.4.0), [project-local CLI](https://viteplus.dev/guide/local-cli), [monorepos](https://viteplus.dev/guide/monorepo), [tasks](https://viteplus.dev/guide/run), [task config](https://viteplus.dev/config/run), [checks](https://viteplus.dev/guide/check), [lint](https://viteplus.dev/guide/lint), [explicit lint config](https://viteplus.dev/config/lint), [format](https://viteplus.dev/guide/fmt), [pack](https://viteplus.dev/guide/pack), and [pack config](https://viteplus.dev/config/pack).
- pnpm 12: [workspace protocol](https://pnpm.io/workspaces), [settings location](https://pnpm.io/settings), [peer behavior](https://pnpm.io/settings/peer-dependencies), and [dependency build policy](https://pnpm.io/settings/build).
- VoidZero, tsdown documentation, currently 0.23.4 with Vite+ bundling 0.23.1: [dependency externalization](https://tsdown.dev/options/dependencies) and [declarations](https://tsdown.dev/options/dts).
- Oxc: [root and override configuration](https://oxc.rs/docs/guide/usage/linter/config.html) and [CLI flags](https://oxc.rs/docs/guide/usage/linter/cli.html).
- Node.js 26.13.0: [package entry points](https://nodejs.org/api/packages.html#package-entry-points).
- OpenAPI TypeScript 7.13.0: [declared compiler peer](https://registry.npmjs.org/openapi-typescript/7.13.0).
