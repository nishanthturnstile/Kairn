# Pen.dev setup and design workflow

Date: 5 November 2026. Status: MCP configured and live canvas read/edit/render/save/reopen verified for all three local Codex profiles; existing T3 sessions still need a tool refresh. [DESIGN.md](../../DESIGN.md) remains the design authority. This document selects no colors, fonts, icons, spacing, logo or page composition.

## 1. Fit for Kairn

Use Pen.dev to explore visual foundations, build reusable components and compose mobile, creator-web and public-web screen states. Components, variables, themes and slots support this work; a source `.lib.pen` library can supply multiple screen documents. This matches our shared design system and separate platform compositions. [Design libraries](https://docs.pen.dev/design-systems/design-libraries).

Treat it as the visual reference. The documentation reviewed does not establish a complete Figma-style navigation/interaction prototyping system for our flows. Before relying on clickable flows, demonstrate the required behavior in the installed version. Use annotated screen states for planning; implement realistic form, navigation, offline and lifecycle interactions in a later bounded code prototype. Imported web layers do not preserve JavaScript behavior. Design-to-code is an agent-assisted implementation and review process. [Design and code](https://docs.pen.dev/design-and-code/design-to-code).

## 2. Cost constraint

The current live pricing page lists Free with five days per month designing with an agent, including external agents over MCP. Tool calls are unlimited within those days; Free allows one agent at a time. Image/SVG generation and model usage have separate allowances. Existing provider subscriptions do not bypass Pen's agent-day allowance. Older search results saying the product is entirely free are superseded by the live page. [Current pricing](https://www.pen.dev/pricing).

Start with Free and the existing T3/Codex provider. Plan focused canvas sessions and do document preparation between them. Check the actual account allowance before beginning substantial work; daily uninterrupted AI canvas editing cannot be promised under the no-new-subscription requirement. Do not activate a paid plan or API billing as part of setup.

## 3. Observed local setup

Initial inspection and subsequent authorized setup on this Windows host established:

| Item | Observed state |
| --- | --- |
| VS Code extension | `highagency.pencildev` version `0.6.79`, displayed as pen.dev |
| Available extension commands | `pen.dev: New File`, `pen.dev: Toggle Design Mode`, `pen.dev: Settings` |
| Default Codex MCP registration | `pencil` exists in `%USERPROFILE%\.codex\config.toml` |
| MCP executable | `%USERPROFILE%\.pencil\mcp\visual_studio_code\out\mcp-server-windows-x64.exe` exists |
| Registered arguments | `--app visual_studio_code --agent codexCLI` |
| This T3 process's `CODEX_HOME` | `%USERPROFILE%\.codex-deva` |
| Profile configuration | `pencil` enabled in `.codex`, `.codex-deva` and `.codex-karthik`; confirmed with each provider's actual Codex CLI |
| Pen tools in this conversation | Existing session has not refreshed its tool list; direct MCP connection verified separately |
| Active canvas/account | Scratch document accessible; Pen reports signed in. Remaining account allowance was not measured. |

T3 settings confirm Nishanth Codex uses `.codex`, Kartik uses `.codex-karthik`, and Deva uses `.codex-deva`. The existing correct Nishanth entry was preserved; the same entry was added to Kartik and Deva. Unrelated TOML settings were checked unchanged, with a private same-directory backup of Kartik's existing config. Account credentials were not changed.

## 4. Minimum connection setup

### A. Start the canvas host

1. Open this Windows Kairn checkout in VS Code with the installed extension enabled.
2. Use `pen.dev: New File` and save an initial scratch document under `.kairn/verification/pen-mcp/connection-check.pen` when testing. Open its design editor; use Toggle Design Mode if it opens as text.
3. Open Pen settings and enable the Codex CLI integration under MCP where the installed version offers it. Keep the VS Code host and intended document open.

The extension can host the canvas; a separate desktop installation is optional for this path. Pen's documented setup connects Codex to a running desktop or IDE host and then reloads the client. The MCP server is called `pencil`, despite the product name pen.dev. [Installation](https://docs.pen.dev/getting-started/installation).

### B. Register the bridge for the actual T3 provider

The intended connection is:

```text
T3 conversation using Codex
  -> registered pencil MCP process (stdio)
  -> local Windows named pipe
  -> running VS Code Pen extension
  -> explicitly selected .pen document
```

The canvas host and MCP process should both run on Windows for this setup. A WSL or remote Codex process does not automatically gain the Windows named-pipe connection. Pen documents stdio between client and server, with a local named pipe on Windows between server and host. [AI integration](https://docs.pen.dev/getting-started/ai-integration).

Use the T3 provider instance's supported MCP configuration mechanism. Verify whether it loads configuration from its configured Codex home or supplies MCP servers separately. If it loads the home configuration, add only the generated `pencil` entry to that home; do not copy the complete default Codex config or replace T3's provider/model/auth settings. Preserve any existing file and unrelated servers.

The currently observed entry has this shape; resolve the executable to this machine's actual user path when configuring:

```toml
[mcp_servers.pencil]
command = 'C:\Users\<Windows-user>\.pencil\mcp\visual_studio_code\out\mcp-server-windows-x64.exe'
args = ['--app', 'visual_studio_code', '--agent', 'codexCLI']
```

This is a local configuration example, not a file already installed by this plan. Prefer the current entry generated by Pen after an extension update. Reload/restart the relevant T3 Codex provider/session after configuring it. Configuration visibility alone is insufficient: the live conversation must expose usable Pen tools. Codex supports local stdio MCP servers and configuration entries under `mcp_servers`; its default config is `~/.codex/config.toml`. [Official Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

No custom MCP server, network service, Docker container or public tunnel is required by the documented local bridge.

### C. Prove the connection before design work

Use the live tool schemas exposed by the installed version. Current documentation names `get_app_state`, `execute`, `read_skill`, `get_style` and conditional `save`; older versions may differ. Confirm the full document path before every edit. [MCP tools](https://docs.pen.dev/getting-started/ai-integration).

The first test must demonstrate: read the intended file, create one labelled scratch frame, inspect its rendered result through supported Pen tooling, save, reopen and verify persistence. If saving is unavailable through MCP, use VS Code Save and verify the disk/reopened result. Do not report the integration ready from registration or a tool listing alone. Remove the scratch document after recording the result unless it is still useful for diagnostics.

The setup execution below completed this live test via the registered stdio MCP executable, while the existing T3 session retains its pre-configuration tool inventory.

## 5. Accounts, CLI and skills

Continue using T3/Codex as the agent; it does not need a second agent running inside Pen for this workflow. Complete Pen's account prompt if required and check its actual plan/usage. Pen's integrated OpenAI provider also supports existing Codex settings or ChatGPT sign-in, but that is a separate optional route. [Authentication](https://docs.pen.dev/getting-started/authentication).

The standalone `@pen.dev/cli` is optional for later headless work and export automation. It requires Node 22.19+ and Pen authentication; it does not remove account limits. Do not install a global CLI or add a runtime dependency merely to connect the extension. If later adopted, use the project's host environment and qualify its installed version. [CLI reference](https://docs.pen.dev/for-developers/pen-cli).

Use Pen's installed tool/skill guidance for canvas operations. Existing design skills can help critique options, but DESIGN.md and the user's fresh choices take precedence over their examples. No additional plugin or skill installation is currently required. Avoid automatic style presets and built-in design-system imports until explicitly selected.

## 6. Repository organization and decision flow

Create documents through Pen after the connection works; do not fabricate `.pen` JSON directly. Keep design sources, libraries and necessary assets together and version them with Git. IDE saving is managed by VS Code; unsaved recovery is not version history. [Pen files](https://docs.pen.dev/core-concepts/pen-files).

Proposed organization, to create as work begins:

```text
DESIGN.md                         current choices and links
design/
  explorations.pen                labelled candidate directions
  kairn-system.lib.pen            selected components and variables
  mobile.pen                      A-screen states
  creator-web.pen                 W-screen states
  public-web.pen                  P-screen states
  assets/                         selected fonts, icons, logo and licensed media
```

Start from an ordinary blank document while exploring. Package the selected system into a library when ready, then import it into screen documents. Keep a source checkpoint before conversion: Pen documents library conversion as irreversible and restricts conversion when libraries are already imported. Save library changes and reopen consuming documents to refresh them. Instances can override inherited values, so inspect unexpected differences. [Library workflow](https://docs.pen.dev/design-systems/design-libraries).

Bind selected colors, spacing and typography to variables in component origins. Keep variable names aligned with the later implementation token names. Code/token copying is an explicit update operation, not continuous synchronization; an instance override can also stop a property following its inherited binding. [Variables and themes](https://docs.pen.dev/design-systems/variables).

When choosing fonts, keep their licenses and files alongside the design. Pen's custom-font import is document-scoped: check availability in every consuming screen file and recheck wrapping. Do not assume that importing a library installs its fonts everywhere. [Text and fonts](https://docs.pen.dev/core-concepts/drawing-and-editing).

## 7. Screen-by-screen execution

1. Read DESIGN.md and only the relevant functional workflow. Explore the next design choice with the user; do not import previous tokens, component screenshots or archived design directions as defaults.
2. After selection, record the choice in DESIGN.md and express it in Pen variables/components. Cover relevant default, focus, selected, pending, disabled and error states.
3. Design a representative form, dense creator task and public reading screen to assess the shared system across different jobs. Their selection does not approve all remaining pages.
4. Work through the existing A/W/P/E responsibilities. Name each frame using its screen ID, state and size, for example `A04.queue / waiting-to-send / phone`. Record its Pen document/frame reference and review status in the corresponding workflow specification as screens are created.
5. For each screen, cover incoming paths, available exits, required data/actions, Back/Cancel, access variants, loading/empty/error/offline and consequential lifecycle states. Maintain a visual flow map or annotations; a finished-looking frame does not establish working navigation.
6. Save and review each bounded batch. Update the workflow if a task grouping or screen changes. Use one agent/editor writer per document to avoid conflicting canvas and disk changes.
7. Once ready, implement selected screens using the `.pen` reference plus functional specifications. Web uses the existing Tailwind/shadcn architecture; native uses Expo/React Native/Unistyles. Compare rendered implementations on their actual platforms. HTML export is reference material, not a native implementation or proof of behavior.

## 8. Session continuity and readiness

Before each session: check remaining Pen allowance, open the correct checkout/document, confirm live tools and active path, read current choices, and name the bounded task. After each batch: inspect, save, update decision/screen references and record unfinished work. Use the established checkout workflow for committed checkpoints; this plan does not authorize publishing a commit or pushing a branch.

If the bridge disconnects, save work in the editor, confirm the host/file and exact MCP registration, reload the affected client, and repeat the small read test. Do not restart design in another file just because the tool loses its connection. On library changes, reopen consumers. On external disk-change warnings, preserve the unsaved canvas separately before choosing which version to keep. No file should have simultaneous headless and editor writers.

The MCP bridge is verified. Reload/reconnect the relevant T3 Codex provider/session to refresh its native tool inventory, keeping VS Code and the intended Pen document open. Current account allowance remains a separate check before extended design work.

## 9. Executed setup verification — 5 November 2026

| Profile / T3 provider | Configuration | Actual Codex CLI read | Live stdio MCP test |
| --- | --- | --- | --- |
| Nishanth / `.codex` | Existing correct entry retained | `mcp get pencil --json` succeeds, enabled | Initialize, four tools listed and saved scratch frame read successfully |
| Kartik / `.codex-karthik` | Added `pencil`; other settings preserved | Same check passes | Same live checks pass |
| Deva / `.codex-deva` | Created minimal MCP config | Same check passes | Same live checks pass |

The live client initialized the actual installed MCP executable and used its advertised schemas. With no canvas open, the first call correctly reported that a file must be open. Opening the scratch document resolved this. The installed server exposes `execute`, `get_app_state`, `get_style` and `read_skill`; it does not advertise `save`.

A neutral scratch frame and two labels were created through `execute`, read back and rendered through `TakeScreenshot`. The screenshot was visually inspected and the layout check reported no clipping. The canvas was saved with VS Code Save; saving completed asynchronously. After confirming the file was nonempty (982 bytes at verification), its saved editor tab was closed and reopened. The same frame and labels were read successfully through a freshly started MCP client for each profile. The welcome document was not edited. Pen's state reported the signed-in account; no generation, subscription change or product design was performed.

Private evidence is under `.kairn/verification/pen-mcp/`: `verification.json`, the scratch `.pen`, screenshot and tool responses. The scratch document remains open for inspection; its default font/color values are solely diagnostic and select no Kairn visual direction. No application build or Git publication was needed. The current T3 conversation's native tool inventory still lacks Pen; a provider/session reload is the remaining activation step, not an unverified claim that the running inventory was updated automatically.
