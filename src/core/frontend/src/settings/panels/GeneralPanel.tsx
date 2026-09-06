import { useEffect, useState, type ReactNode } from "react";
import { FolderOpen, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@shared/frontend/ui/button";

const REPO_URL = "https://github.com/andrejvysny/OpenPCB";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-control border border-border bg-surface-panel p-5">
      <h3 className="text-sm font-semibold text-text-strong">{title}</h3>
      {children}
    </section>
  );
}

function DesktopOnlyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
      {children}
    </p>
  );
}

function statusLabel(status: UpdaterStatus | null): string {
  switch (status?.state) {
    case "checking":
      return "Checking for updates…";
    case "current":
      return "You're on the latest version.";
    case "available":
      return `Version ${status.version} is available to download.`;
    case "available-manual":
      return `Version ${status.version} is available.`;
    case "downloaded":
      return `Version ${status.version} downloaded — restart to install.`;
    case "error":
      return `Couldn't check for updates: ${status.message}`;
    default:
      return "Check whether a newer version is available.";
  }
}

function UpdatesSection() {
  const updater = typeof window !== "undefined" ? window.updater : undefined;
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!updater) return;
    updater.onStatus((next) => {
      setStatus(next);
      setChecking(next.state === "checking");
      if (next.state !== "downloaded") setPercent(null);
    });
    updater.onProgress((p) => setPercent(p.percent));
  }, [updater]);

  if (!updater) {
    return (
      <Section title="Updates">
        <DesktopOnlyNote>
          Updates are managed by the OpenPCB desktop app.
        </DesktopOnlyNote>
      </Section>
    );
  }

  const check = () => {
    setChecking(true);
    void updater.check();
  };

  return (
    <Section title="Updates">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">
          {percent !== null && status?.state !== "downloaded"
            ? `Downloading… ${Math.round(percent)}%`
            : statusLabel(status)}
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={
            <RefreshCw
              className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
              strokeWidth={1.8}
            />
          }
          onClick={check}
          disabled={checking}
          className="cursor-pointer"
        >
          Check for updates
        </Button>
      </div>

      {status?.state === "available" ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => void updater.download()}
          className="cursor-pointer"
        >
          Download update
        </Button>
      ) : null}

      {status?.state === "available-manual" ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => void updater.openReleases()}
          className="cursor-pointer"
        >
          View release
        </Button>
      ) : null}

      {status?.state === "downloaded" ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => void updater.install()}
          className="cursor-pointer"
        >
          Restart &amp; install
        </Button>
      ) : null}

      <p className="text-xs text-text-tertiary">
        Updates are downloaded from{" "}
        <a
          href={`${REPO_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-text"
        >
          GitHub Releases
        </a>
        . On macOS, new versions are installed manually.
      </p>
    </Section>
  );
}

function FilesSection() {
  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  const [paths, setPaths] = useState<{
    logs: string;
    crashDumps: string;
    userData: string;
  } | null>(null);

  useEffect(() => {
    if (!api?.getDiagnosticsPaths) return;
    api
      .getDiagnosticsPaths()
      .then((p) => setPaths(p))
      .catch(() => setPaths(null));
  }, [api]);

  if (!api?.getDiagnosticsPaths) {
    return (
      <Section title="Files & logs">
        <DesktopOnlyNote>
          Local file locations are available in the desktop app.
        </DesktopOnlyNote>
      </Section>
    );
  }

  const rows: Array<{
    label: string;
    path: string | undefined;
    open: (() => Promise<FolderOpenResult>) | undefined;
  }> = [
    { label: "Logs", path: paths?.logs, open: api.openLogsFolder },
    {
      label: "Crash reports",
      path: paths?.crashDumps,
      open: api.openCrashDumpsFolder,
    },
    { label: "App data", path: paths?.userData, open: api.openUserDataFolder },
  ];

  return (
    <Section title="Files & logs">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-text">
                {row.label}
              </p>
              <p
                className="truncate font-mono text-xs text-text-tertiary"
                title={row.path}
              >
                {row.path ?? "…"}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Open ${row.label} folder`}
              title={`Open ${row.label} folder`}
              icon={<FolderOpen className="h-4 w-4" strokeWidth={1.8} />}
              onClick={() => void row.open?.()}
              disabled={!row.open}
              className="w-8 flex-shrink-0 cursor-pointer px-0"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function GeneralPanel() {
  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-text-strong">
          General
        </h2>
        <p className="text-sm text-text-secondary">
          Appearance, updates, and local files.
        </p>
      </div>

      <Section title="Appearance">
        <ThemeToggle />
      </Section>

      <UpdatesSection />
      <FilesSection />
    </div>
  );
}
