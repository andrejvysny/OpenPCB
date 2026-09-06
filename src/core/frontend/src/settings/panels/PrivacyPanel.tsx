import { useEffect, useState } from "react";

export function PrivacyPanel() {
  const prefs =
    typeof window !== "undefined" ? window.electronAPI?.preferences : undefined;
  const [optIn, setOptIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!prefs) {
      setOptIn(false);
      return;
    }
    prefs
      .getTelemetryOptIn()
      .then(setOptIn)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setOptIn(false);
      });
  }, [prefs]);

  const toggle = async () => {
    if (optIn === null || !prefs) return;
    const next = !optIn;
    setSaving(true);
    setError(null);
    try {
      await prefs.setTelemetryOptIn(next);
      setOptIn(next);
      setTouched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const available = Boolean(prefs);

  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-text-strong">
          Privacy
        </h2>
        <p className="text-sm text-text-secondary">
          Control what OpenPCB sends outside your machine. OpenPCB runs fully
          offline by default — no project data, no schematics, and no design
          files ever leave your computer.
        </p>
      </div>

      <section className="space-y-3 rounded-control border border-border bg-surface-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label
              htmlFor="telemetry-opt-in"
              className="text-sm font-medium text-text-strong"
            >
              Crash and error reporting
            </label>
            <p className="text-xs text-text-secondary">
              Send anonymous crash reports and uncaught errors to the OpenPCB
              team via Sentry. Helps us find and fix bugs faster. No project
              files, schematic content, or personally identifying information is
              included.
            </p>
            <p className="text-xs text-text-tertiary">
              Changes take effect on next launch.
            </p>
          </div>
          <input
            id="telemetry-opt-in"
            type="checkbox"
            checked={optIn ?? false}
            disabled={!available || optIn === null || saving}
            onChange={() => void toggle()}
            className="mt-1 h-5 w-5 cursor-pointer rounded border-border-control text-selection focus:ring-selection disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {!available ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            Telemetry settings are only available in the desktop app.
          </p>
        ) : null}

        {touched && available ? (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-900/30 dark:text-blue-200">
            Restart OpenPCB to apply this change.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-900 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </p>
        ) : null}
      </section>

      <p className="text-xs text-text-tertiary">
        See{" "}
        <a
          href="https://github.com/OpenPCB-app/OpenPCB/blob/main/SECURITY.md"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-text-strong"
        >
          SECURITY.md
        </a>{" "}
        for details on what is reported when this is enabled.
      </p>
    </div>
  );
}
