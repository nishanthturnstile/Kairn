"""Probe pinned generator/compiler pairs outside the application workspace."""

import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


OUTPUT = Path(__file__).with_name("typescript6_compatibility.json")
VERSIONS = ["5.9.3", "6.0.3", "7.0.2"]
SCHEMA = {
    "openapi": "3.1.0",
    "info": {"title": "Synthetic compiler compatibility fixture", "version": "1"},
    "paths": {
        "/system": {
            "get": {
                "operationId": "readSystem",
                "responses": {
                    "200": {
                        "description": "Synthetic result",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Result"}
                            }
                        },
                    }
                },
            }
        }
    },
    "components": {
        "schemas": {
            "Money": {
                "type": "object",
                "required": ["amount", "currency"],
                "properties": {
                    "amount": {"type": "string", "pattern": "^[0-9]+(\\.[0-9]+)?$"},
                    "currency": {"type": "string"},
                },
                "additionalProperties": False,
            },
            "Result": {
                "oneOf": [
                    {
                        "type": "object",
                        "required": ["kind", "money"],
                        "properties": {
                            "kind": {"type": "string", "const": "ready"},
                            "money": {"$ref": "#/components/schemas/Money"},
                        },
                        "additionalProperties": False,
                    },
                    {
                        "type": "object",
                        "required": ["kind", "reason"],
                        "properties": {
                            "kind": {"type": "string", "const": "unavailable"},
                            "reason": {"type": "string"},
                        },
                        "additionalProperties": False,
                    },
                ]
            },
        }
    },
}
CONSUMER = '''import type { components, paths } from "./generated.js";
type Result = paths["/system"]["get"]["responses"][200]["content"]["application/json"];
export function describe(result: Result): string {
    if (result.kind === "ready") return result.money.amount;
    return result.reason;
}
export const money: components["schemas"]["Money"] = { amount: "12.50", currency: "INR" };
// @ts-expect-error Decimal money crosses this fixture's JSON boundary as a string.
export const invalidMoney: components["schemas"]["Money"] = { amount: 12.5, currency: "INR" };
// @ts-expect-error Unknown states must not be accepted by the generated union.
export const invalidResult: Result = { kind: "processing" };
'''


def run(args, cwd):
    process = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=240)
    return {
        "exitCode": process.returncode,
        "stdoutTail": process.stdout[-3500:],
        "stderrTail": process.stderr[-3500:],
    }


def main():
    if not shutil.which("pnpm"):
        raise RuntimeError("The selected pnpm must be available")
    results = []
    with tempfile.TemporaryDirectory(prefix="kairn-ts6-probe-") as scratch:
        for version in VERSIONS:
            case = Path(scratch) / version
            case.mkdir()
            (case / "package.json").write_text(json.dumps({
                "name": "kairn-compiler-probe",
                "private": True,
                "type": "module",
                "packageManager": "pnpm@12.16.1",
                "devDependencies": {"openapi-typescript": "7.13.0", "typescript": version},
            }, indent=2) + "\n")
            (case / "pnpm-workspace.yaml").write_text(
                "packages:\n  - .\nautoInstallPeers: false\n"
                "dedupePeerDependents: false\nstrictPeerDependencies: false\n"
            )
            (case / "schema.json").write_text(json.dumps(SCHEMA, indent=2) + "\n")
            (case / "consumer.ts").write_text(CONSUMER)
            (case / "tsconfig.json").write_text(json.dumps({
                "compilerOptions": {
                    "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext",
                    "strict": True, "noUncheckedIndexedAccess": True, "noEmit": True,
                    "skipLibCheck": False, "types": [],
                },
                "files": ["consumer.ts", "generated.d.ts"],
            }, indent=2) + "\n")
            print(f"Testing TypeScript {version}", flush=True)
            record = {"typescript": version}
            record["install"] = run([
                "pnpm", "install", "--ignore-scripts", "--reporter", "append-only",
                "--no-frozen-lockfile",
            ], case)
            if record["install"]["exitCode"] != 0:
                results.append(record)
                continue
            record["resolvedCompiler"] = run([
                "node", "--input-type=module", "-e",
                "import ts from 'typescript'; console.log(JSON.stringify({version:ts.version,factory:typeof ts.factory,syntaxKind:typeof ts.SyntaxKind,resolved:import.meta.resolve('typescript')}))",
            ], case)
            record["cliGeneration"] = run([
                "pnpm", "exec", "openapi-typescript", "schema.json", "--output", "generated.d.ts",
            ], case)
            record["apiGeneration"] = run([
                "node", "--input-type=module", "-e",
                "import fs from 'node:fs'; import openapiTS,{astToString} from 'openapi-typescript'; const result=astToString(await openapiTS(JSON.parse(fs.readFileSync('schema.json','utf8')))); fs.writeFileSync('generated-api.d.ts',result); console.log(result.includes('readSystem') ? 'API generation passed' : 'missing operation');",
            ], case)
            generated = case / "generated.d.ts"
            if record["cliGeneration"]["exitCode"] == 0 and generated.exists():
                record["generatedSha256"] = hashlib.sha256(generated.read_bytes()).hexdigest()
                record["consumerTypecheck"] = run(["pnpm", "exec", "tsc", "--noEmit"], case)
            results.append(record)
            print(f"Generation exits: CLI={record['cliGeneration']['exitCode']}, API={record['apiGeneration']['exitCode']}", flush=True)
        successful = {r["typescript"]: r for r in results if r.get("cliGeneration", {}).get("exitCode") == 0}
        cross_checks = []
        if "6.0.3" in successful:
            ts6_output = (Path(scratch) / "6.0.3" / "generated.d.ts").read_bytes()
            for version in VERSIONS:
                case = Path(scratch) / version
                if not (case / "node_modules").exists():
                    continue
                (case / "generated.d.ts").write_bytes(ts6_output)
                cross_checks.append({"consumerCompiler": version, **run(["pnpm", "exec", "tsc", "--noEmit"], case)})
        evidence = {
            "observedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "node": subprocess.check_output(["node", "--version"], text=True).strip(),
            "pnpm": subprocess.check_output(["pnpm", "--version"], text=True).strip(),
            "generator": "openapi-typescript@7.13.0",
            "declaredCompilerPeer": "^5.x",
            "scope": "Isolated temporary installations, CLI/API generation of a synthetic OpenAPI3.1 fixture, discriminated unions and decimal-string consumer checks. No application dependencies installed.",
            "cases": results,
            "typescript6OutputConsumerChecks": cross_checks,
        }
        OUTPUT.write_text(json.dumps(evidence, indent=2) + "\n")
        print(f"Saved {OUTPUT.name}", flush=True)
        assert successful["5.9.3"]["consumerTypecheck"]["exitCode"] == 0
        assert successful["6.0.3"]["consumerTypecheck"]["exitCode"] == 0
        for version in ["5.9.3", "6.0.3"]:
            assert successful[version]["apiGeneration"]["exitCode"] == 0
            assert "API generation passed" in successful[version]["apiGeneration"]["stdoutTail"]
        assert successful["5.9.3"]["generatedSha256"] == successful["6.0.3"]["generatedSha256"]
        negative = next(r for r in results if r["typescript"] == "7.0.2")
        assert negative["cliGeneration"]["exitCode"] != 0
        assert negative["apiGeneration"]["exitCode"] != 0
        assert len(cross_checks) == 3
        assert all(r["exitCode"] == 0 for r in cross_checks)


if __name__ == "__main__":
    main()
