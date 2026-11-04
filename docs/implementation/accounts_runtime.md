# Local account runtime

B04 account routes are optional. Without `KAIRN_ACCOUNTS_CONFIG`, the process retains the account-disabled foundation behavior. This guide activates only an isolated development stack and Mailpit, never production mail or shared journey data. Follow the [checkout workflow](checkout_workflow.md) and [native host guide](native_host_setup.md) for exact committed inputs and owning-OS builds.

## Private configuration and startup

From the WSL authoring checkout, activate its pinned environment and run:

```sh
node scripts/setup-accounts-local.mjs
docker compose --project-name kairn-b04-local -f compose.yaml -f compose.override.yaml -f infra/compose/accounts-local.yaml up --build --detach --wait postgres storage mailpit migrate server worker edge
docker compose --project-name kairn-b04-local -f compose.yaml -f compose.override.yaml -f infra/compose/accounts-local.yaml --profile tools run --build --rm --no-deps tooling node scripts/init-account-storage.mjs
```

The setup writes mode-0600 server/worker JSON under ignored `.kairn/accounts/`, with shared random mail sealing keys and separate random auth/abuse secrets. It preserves an existing complete pair and refuses an incomplete pair. Never stage or copy these files into an image. The Compose override mounts them read-only. The S3 bucket stays private; browser/native clients receive authenticated application paths only.

The isolated edge listens on loopback `8086`; Mailpit UI listens on `8026`. The example reserves `10.245.87.0/24` and trusts only edge `10.245.87.2/32`. Dynamic containers use `10.245.87.128/25`, reserving the edge address outside that pool. Inspect local networks before activation; if this subnet is occupied, change both the private trusted-proxy configuration and explicit override consistently. Do not reuse or stop another checkout's `kairn` project. Stop only this named project when its acceptance run ends; removing its database volume is a separate deliberate action.

The local canonical origin is `https://nishanth-windows.tail30fb6a.ts.net:8444`. Use a separate Windows private Serve route on `8444` to loopback `8086`, preserving the established `8443` → `8080` route and active prototype work. Native qualification sets `EXPO_PUBLIC_API_URL` to this isolated origin in its Metro process; do not overwrite the canonical checkout’s ignored environment file. A changed local port alone does not make the stack reachable by devices. The canonical host, server and worker origins must agree. Do not disable HTTPS/origin checks or enable public Funnel to avoid this handoff.

## Transport and lifecycle boundaries

The Node adapter binds each request to its socket peer and rebuilds the request URL from the configured canonical origin. Only an explicitly trusted proxy peer can supply `X-Kairn-Client-IP`; Caddy overwrites that header. Missing transport identity fails closed for account mutations. Native auth accepts the exact configured app scheme; domain requests send the canonical origin and an awaited SecureStore cookie. Forwarded Host/protocol and Expo origin override are not authorities.

Authentication uses a two-connection auth pool; checked profile/avatar commands use the existing four-connection API pool. Producers reuse those pools. Account workers add a two-connection domain pool to existing queue/readiness pools. See the [database budget](identity_database.md#pool-budget-and-qualification-scope).

`KAIRN_ACCOUNT_WORKER_CONFIG` permits Mailpit's explicit local-fixture mode and deliberately has no independent restriction journal. Mail and private avatar processing work locally; restrictive commands deny access immediately but retain pending recovery confirmation. This is not G09 completion. `KAIRN_DOMAIN_WORKER_CONFIG` retains the full production journal and SMTP requirements. Actual independent-host recovery qualification and verified production sender/origin remain deployment gates.

## Acceptance

`pnpm verify:accounts` owns a disposable marked Compose database, real auth/API/worker roles, private S3 and Mailpit. It drives the packaged browser UI over fixture HTTPS, retaining responsive screenshots under ignored `.kairn/verification/b04/browser-artifacts/`. Fixture self-signed trust is confined to that test browser. The aggregate `pnpm verify` includes this scenario alongside existing web, identity, domain and data checks. Test projects clean up only their own resources.

Native acceptance still requires a frozen install and new local compiled build on Windows/Mac because SecureStore, Image Picker, Crypto, Network and WebBrowser change the native graph. Metro exports do not qualify these modules or native fonts. Record build source, Pod lock, installed artifact, Metro inputs, actual device actions and remaining physical-device limitations in [B04 progress](accounts_journeys_access_progress.md#b04-account-experience-and-native-checkpoint-4-november-2026).
