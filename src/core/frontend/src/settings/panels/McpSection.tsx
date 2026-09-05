import { useEffect, useState } from "react";
import { Check, Copy, Plug } from "lucide-react";
import type { AssistantSettings } from "../../../../../sdks/assistant";

/**
 * MCP server controls.
 *
 * Two independent switches, both default off: the server itself, and whether
 * write tools are advertised to it. They are separate because enabling the
 * server is about reachability (read your designs from Claude Code) while
 * enabling writes hands an external process a scripted path to mutate them.
 *
 * `settings-store.ts` also forces writes off whenever the server is off, so the
 * disabled state here matches what the backend will actually persist.
 */

interface Props {
  settings: AssistantSettings | null;
  onSave: (patch: Partial<AssistantSettings>) => void;
}

type Snippet = { id: string; label: string; hint: string; value: string };

function buildSnippets(config: McpConfig | null): Snippet[] {
  if (!config) return [];
  const snippets: Snippet[] = [];

  if (config.shimAvailable && config.shimPath) {
    snippets.push({
      id: "claude-code-stdio",
      label: "Claude Code",
      hint: "Run this in your terminal.",
      value: `claude mcp add openpcb -- "${config.shimPath}"`,
    });
    snippets.push({
      id: "claude-desktop",
      label: "Claude Desktop",
      hint: "Merge into claude_desktop_config.json, then restart Claude Desktop.",
      value: JSON.stringify(
        { mcpServers: { openpcb: { command: config.shimPath } } },
        null,
        2,
      ),
    });
  }

  if (config.url) {
    snippets.push({
      id: "http",
      label: "HTTP (Claude Code, Codex)",
      hint: "The port changes on every app restart — re-copy after restarting OpenPCB.",
      value: `claude mcp add --transport http openpcb ${config.url} --header "Authorization: Bearer ${config.token}"`,
    });
  }

  return snippets;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => setCopied(true));
      }}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-control border border-border px-2 py-1 text-[11px] text-text-secondary hover:bg-surface-hover"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </button>
  );
}

export function McpSection({ settings, onSave }: Props) {
  const [config, setConfig] = useState<McpConfig | null>(null);
  const enabled = settings?.mcpEnabled ?? false;
  const allowWrites = settings?.mcpAllowWrites ?? false;

  useEffect(() => {
    if (!enabled) return;
    const api = window.electronAPI?.getMcpConfig;
    if (!api) return;
    // Re-read whenever the server is switched on: the URL carries the backend's
    // ephemeral port, which is new on every app launch.
    void api()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, [enabled]);

  const snippets = buildSnippets(config);

  return (
    <section>
      <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-text-caps">
        <Plug className="h-3 w-3" /> MCP server
      </div>

      <p className="mb-2 text-xs text-text-tertiary">
        Lets Claude Code, Claude Desktop and Codex read and edit the design you
        have open. OpenPCB must be running.
      </p>

      <label className="flex items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onSave({ mcpEnabled: e.target.checked })}
          className="h-3.5 w-3.5"
        />
        Enable MCP server
      </label>

      <label
        className={`mt-2 flex items-center gap-2 text-xs ${
          enabled
            ? "text-text-secondary"
            : "text-text-disabled"
        }`}
      >
        <input
          type="checkbox"
          disabled={!enabled}
          checked={allowWrites}
          onChange={(e) => onSave({ mcpAllowWrites: e.target.checked })}
          className="h-3.5 w-3.5"
        />
        Allow writes from MCP clients
        <span className="rounded bg-amber-100 px-1.5 text-[9px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          Caution
        </span>
      </label>

      {enabled && (
        <p className="mt-1.5 text-[11px] text-text-tertiary">
          {allowWrites
            ? "Place, wire and edit tools are advertised. Non-destructive edits apply immediately and are undoable; deletions wait for your approval in the chat panel."
            : "Read-only. Connected clients can inspect designs, run ERC/DRC and read the BOM, but cannot change anything."}
        </p>
      )}

      {enabled && snippets.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="rounded-card border border-border p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-text-secondary">
                    {snippet.label}
                  </div>
                  <div className="text-[10px] text-text-tertiary">
                    {snippet.hint}
                  </div>
                </div>
                <CopyButton value={snippet.value} />
              </div>
              <pre className="mt-1.5 overflow-x-auto rounded bg-surface-panel p-1.5 text-[10px] text-text-secondary">
                {snippet.value}
              </pre>
            </div>
          ))}
        </div>
      )}

      {enabled && config && !config.shimAvailable && (
        <p className="mt-2 text-[11px] text-text-tertiary">
          The stdio bridge ships with packaged builds only, so the Claude
          Desktop snippet is unavailable in development.
        </p>
      )}
    </section>
  );
}
