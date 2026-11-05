# Ecosystem direction planning progress

Date: 4 November 2026. Scope: durable planning changes requested by the founder, not implementation of eight packages.

## Source and changes

- Windows is the authoring checkout for this documentation task. Started clean on `feat/design-system-redesign` at `883fffd817a75a29dc884a3ca63a697533b9e5c6`; that existing branch was preserved.
- Fetched `origin` and synchronized through the checkout helper to current `development`, `d07a69508d98afecb5c9d1b9003956d1db1fa236`. The helper reported clean source and preservation of three protected host files. No native build or Metro process was running in the inspected Windows process list. No other host was changed.
- Created `chore/ecosystem-direction` from that development commit. No PR, push, merge, native qualification or CI result is claimed.
- Added the [ecosystem direction](../core/ecosystem_direction.md), mapped all eight responsibilities and three longer-term ideas, specified processing/publication/viewing boundaries, and recorded E0–E5 work packets and dependencies.
- Linked the direction from the product plan, requirements, architecture, application design and documentation map. Corrected stale global claims that implementation had not started; existing progress documents remain the status authorities.
- R1 requirement IDs, delivery order, runtime dependencies, package layout and foundation acceptance are unchanged.

## Verification scope

Documentation-only change: inspect the diff, check whitespace, resolve changed-file relative Markdown links and compare the R1 functional-ID set with the baseline. No application tests or native builds are warranted; these edits provide no runtime acceptance evidence.

The first host-tool activation attempt was rejected by PowerShell's script execution policy; the built-in-only checkout helper still completed using the available Node. Subsequent verification uses process-local execution-policy configuration before activating `.kairn/env.ps1`; no machine-wide policy change is needed.

Executed results: `git diff --check` passed; all 148 relative Markdown file links across the seven changed/new documents resolved; all 117 unique functional requirement IDs match the development baseline. Host activation succeeded with the process-only policy setting (Node `v26.13.0`). Reviewed the scope mapping against requirements sections 1, 8, 11, 12, 16 and 18, and the proposed boundaries against architecture section 5. TrailReplay's first-party repository supplied the limited published-capability comparison; no competitor interaction testing was performed.

## Remaining work

E0 contract/fixture design is the recommended next ecosystem packet. E1–E5 have not been implemented by this change. Continue the current accounts/access and complete R1 workstreams; extraction and later outputs must not substitute for those gates. Public licensing, external compatibility commitments, package publication and portable-output rights remain decisions before distribution, not new prerequisites for R1 development.
