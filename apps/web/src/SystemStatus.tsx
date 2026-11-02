import { useQuery } from "@tanstack/react-query";
import { systemQuery } from "./system-query.js";

export function SystemStatus() {
  const status = useQuery(systemQuery(window.location.origin));
  if (status.isPending) return <p role="status">Checking service…</p>;
  if (status.isError)
    return (
      <p role="alert">
        Service status is unavailable. <button onClick={() => void status.refetch()}>Retry</button>
      </p>
    );
  return (
    <p role="status">
      Service online · contract {status.data.contractVersion} · sync{" "}
      {status.data.syncProtocolVersion}
    </p>
  );
}
