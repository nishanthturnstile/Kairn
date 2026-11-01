# TypeScript 6 OpenAPI compatibility findings

Date: 1 November 2026. The selected `openapi-typescript@7.13.0` works with `typescript@6.0.3` for the executed research fixture. Its declared peer remains `^5.x`, so functional compatibility and declared package support must be recorded separately.

## Executed checks

The [repeatable probe](probe_openapi_typescript6.py) created separate temporary projects with the selected Node `26.13.0`, pnpm `12.16.1`, and generator. Each project installed exactly one compiler version. Automatic peer installation was disabled, the resolved compiler import was recorded, and unrelated TypeScript 5 injection could not make the TypeScript 6 case appear successful. Dependency lifecycle scripts were disabled.

| Compiler running the generator | CLI generation | JavaScript API generation | Generated fixture consumer |
|---|---|---|---|
| TypeScript 5.9.3, control | Pass | Pass | Pass |
| TypeScript 6.0.3, requested candidate | Pass | Pass | Pass |
| TypeScript 7.0.2, negative control | Fails at legacy factory API | Fails at legacy factory API | Generator emits no output |

The synthetic OpenAPI 3.1 fixture includes a referenced decimal-string money object, a discriminated result union, and a typed operation response. Consumer checks include valid access and intentional invalid states/numeric money guarded by `@ts-expect-error`, with `skipLibCheck: false`.

The TypeScript 5 and 6 CLI outputs have the same SHA-256 hash. The TypeScript 6 output also passes consumer checks under TypeScript 5.9.3, 6.0.3, and 7.0.2. This distinguishes running the generator from consuming its emitted declarations. [Full execution evidence](typescript6_compatibility.json).

## Interpretation and plan change

TypeScript 6 retains the JavaScript compiler implementation and the legacy factory APIs used by this generator. TypeScript 7's root import exposes version information rather than that API. Microsoft's release documentation explains the compiler transition. [TypeScript 6 release](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [TypeScript 7 migration](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

Use pinned TypeScript 6.0.3 in the development-only API-generation workspace. Keep web/shared checking on TypeScript 7 and mobile on the SDK-selected TypeScript 6 family. The earlier TypeScript 5 recommendation is superseded by this executed TypeScript 6 result.

The generator's metadata still declares `typescript: ^5.x`, and the temporary TypeScript 6 installation reports a peer issue. The research deliberately allowed the peer mismatch so behavior could be tested. During repository implementation, record a package-specific compatibility adjustment for this exact tested pair instead of disabling peer checks globally. This is our tested compatibility exception, not an upstream claim of TypeScript 6 support. [Generator metadata](https://registry.npmjs.org/openapi-typescript/7.13.0), [TypeScript 6 metadata](https://registry.npmjs.org/typescript/6.0.3).

## Limits and reproduction

This establishes generation for the fixture and the checked compiler versions. It does not qualify every future project schema, plugin, generator option, or the complete web/native dependency graph. Retain a regression check with the actual project's OpenAPI document once it exists.

Run the probe from the repository root with Python, selected Node/pnpm, and registry access:

```sh
python3 docs/research/repository-setup/probe_openapi_typescript6.py
```

It installs dependencies only in temporary directories, removes those directories afterward, and updates the JSON evidence beside the script. The pnpm package store may retain downloaded packages. No application workspace or lockfile is created.

All external sources are Tier 1 maintainer documentation or official registry metadata. The compatibility conclusion additionally rests on local execution rather than documentation alone.
