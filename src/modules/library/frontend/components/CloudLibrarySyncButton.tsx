import { useCallback, useState, type ReactElement } from "react";
import { CloudDownload, CloudUpload } from "lucide-react";
import { useAuth } from "@/cloud/AuthProvider";
import { readCloudConfig } from "@/cloud/config";
import { useFeatureFlag } from "@/feature-flags";

interface Props {
  backendURL?: string | null;
  moduleId: string;
  /** Called after a successful pull so the caller can refresh the list. */
  onChanged?: () => void;
}

interface SyncResult {
  componentCount: number;
  uploaded: boolean;
}
interface PullResult {
  imported: boolean;
  components: number;
}

/**
 * "Sync to Cloud" (push) + "Pull" for the user's custom component library.
 * Push uploads custom components (is_builtin=0) to the personal cloud workspace
 * as an .opclib pack; pull downloads + imports the latest cloud pack. Hidden
 * when cloud is unavailable or the user is signed out. Token is sent per-request
 * via x-cloud-bearer (never stored), mirroring the designer cloud sync.
 */
export function CloudLibrarySyncButton({
  backendURL,
  moduleId,
  onChanged,
}: Props): ReactElement | null {
  const { enabled, session } = useAuth();
  const libraryCloudEnabled = useFeatureFlag("cloud.library");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const call = useCallback(
    async <T,>(action: "sync" | "pull"): Promise<T | null> => {
      if (!backendURL || !session) return null;
      const cfg = readCloudConfig();
      const res = await fetch(
        `${backendURL}/api/modules/${moduleId}/cloud/${action}`,
        {
          method: "POST",
          headers: {
            "x-cloud-bearer": session.access_token,
            "x-cloud-api-url": cfg.apiUrl,
          },
        },
      );
      const payload = (await res.json().catch(() => null)) as {
        data?: { result?: T };
      } | null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return payload?.data?.result ?? null;
    },
    [backendURL, moduleId, session],
  );

  const sync = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    setFailed(false);
    try {
      const r = await call<SyncResult>("sync");
      setStatus(
        r?.uploaded
          ? `Synced ${r.componentCount} component${r.componentCount === 1 ? "" : "s"}`
          : "No custom components to sync",
      );
    } catch (err) {
      setFailed(true);
      setStatus(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }, [call]);

  const pull = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    setFailed(false);
    try {
      const r = await call<PullResult>("pull");
      setStatus(
        r?.imported ? `Pulled ${r.components} component(s)` : "Nothing to pull",
      );
      if (r?.imported) onChanged?.();
    } catch (err) {
      setFailed(true);
      setStatus(err instanceof Error ? err.message : "Pull failed");
    } finally {
      setBusy(false);
    }
  }, [call, onChanged]);

  if (!enabled || !session || !libraryCloudEnabled) return null;

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={() => void sync()}
        disabled={busy || !backendURL}
        title={status ?? "Sync your custom components to OpenPCB Cloud"}
        className="inline-flex h-[22px] items-center gap-1.5 rounded-l-control border border-border-control px-2 text-xs text-text outline-none transition-colors hover:bg-surface-hover hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CloudUpload className="h-3 w-3" strokeWidth={1.5} />
        <span className={failed ? "text-status-danger" : undefined}>
          {busy ? "Syncing…" : (status ?? "Sync to Cloud")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => void pull()}
        disabled={busy || !backendURL}
        title="Pull custom components from OpenPCB Cloud"
        aria-label="Pull custom components from cloud"
        className="inline-flex h-[22px] items-center rounded-r-control border border-l-0 border-border-control px-1.5 text-text outline-none transition-colors hover:bg-surface-hover hover:text-text-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CloudDownload className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}
