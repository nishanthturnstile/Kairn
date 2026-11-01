---
name: kairn-capture-sync
description: Implement or review Kairn's native capture, selected imports, durable files and SQLite state, upload recovery, offline commands, and synchronization on Android and iOS.
---

# Durable capture and synchronization

Read [requirements sections 5 and 6](../../../docs/core/product_requirements.md#5-capture-offline-saving-and-synchronisation) and [architecture section 8](../../../docs/core/architecture.md#8-durable-capture-import-and-synchronization). Use the authoritative documents for limits and protocol details rather than copying them into this skill.

- A local-save acknowledgment requires verified bytes in app-owned persistent storage plus committed SQLite metadata and command references. Filesystem and SQLite changes are not one transaction: retain staged states, deterministic paths, and startup reconciliation.
- Capture does not wait for location, network, transcription, or AI. Preserve unknown/approximate location explicitly. Picker cache files or expiring content URIs cannot be the only saved copy.
- Query caches represent fetched state; they never own the only copy of media or unsent commands. Keep persistence, transfer, source-access, and publication-inclusion states separate in code and UI.
- Use stable object/operation IDs and expected revisions. Persist acknowledged upload parts, reconcile with the server/store after interruption, and verify the completed object's actual size and whole-file checksum. A multipart ETag is not that checksum.
- A retry returns the accepted result rather than repeating side effects. Cancellation preserves the local original. Stale edits retain the attempted candidate; full resync after cursor expiry preserves unsent work.
- Enforce current membership and source rights throughout sync. Process access tombstones on reconnect; do not claim remote erasure of offline or downloaded bytes. Exact import deduplication stays within the documented owner/destination scope.
- Foreground sync is the dependable path. OS background work is opportunistic; neither platform promises immediate transfer after termination/force-stop. Add a bounded native transfer module only for a demonstrated requirement.

Verify real Android and iOS captures across offline saving, interruption, relaunch, retry, expired authentication, missing files, denied permissions, cancellation, and revoked access as applicable. Distinguish process death from force-stop/uninstall; reinstall may lose unsynced data. Follow session device-tool instructions and use physical hardware where camera/background behavior requires it.
