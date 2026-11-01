---
name: kairn-publication-access
description: Implement or review Kairn's journey capabilities, source and export grants, approved publication snapshots, media access, revocation, grounded citations, and recovery restrictions.
---

# Publication and current access

Read [requirements sections 2, 11, 15, and 16](../../../docs/core/product_requirements.md) and [architecture sections 9, 11, 13, and 15](../../../docs/core/architecture.md). Use their capability matrix, publication rules, and restore protocol for the affected feature.

- Authentication alone grants no journey/source/export authority. Check current membership capabilities, owner rights, source grants, publication eligibility, and takedown state server-side. Ordinary participants do not automatically see draft/review sources.
- Publication activates the exact reviewed draft and policy generation. Build candidate artifacts privately; recheck generations under the documented lock/version discipline before atomically switching the active approved pointer. New drafts or transcripts do not silently change the public corpus.
- Track dependencies from sources to derived narrative, geometry, media, cards, search chunks, shares, citations, and answers. Current denies override old approved versions. An obsolete job must never restore withdrawn material.
- Recheck access on managed HTML/API/source/media GET/HEAD/Range requests, exports, saved previews, and stored answers. Raw object URLs, permanent public buckets, or positive permission caches must not bypass a later restriction. Redact payloads and derivatives before serialization, not just markers in the UI.
- A restrictive action denies locally immediately; successful completion requires the independent restriction-journal receipt. Keep pending recovery confirmation visible and retry with the same event identity. Restore must replay restrictions and fail closed when its authoritative recovery boundary is uncertain.
- Retrieval filters the authorized approved subset in SQL before ranking/context construction. Validate citation membership and source access, buffer generated answers, and recheck publication/policy generation before serving. Prior conversation content cannot reintroduce withdrawn facts.
- Preserve source-owner originals and explicit export rights. Leaving, withdrawal, archive, unpublish, account deletion, and canonical deletion are distinct actions. Already downloaded bytes and external previews cannot be recalled.

Exercise old links, ranges, stale jobs, cached previews, exports, stored answers, withdrawal during generation, and restore/replay for the changed feature. Treat uncertain dependency coverage as a reason to suppress the affected publication until rebuilt, not as permission to guess a safe fragment.
