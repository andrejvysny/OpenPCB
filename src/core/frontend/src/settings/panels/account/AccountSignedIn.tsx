import { CircleCheck } from "lucide-react";
import { useAuth } from "@/cloud/AuthProvider";
import { useCloudPrefs } from "@/cloud/cloud-prefs";
import { useFeatureFlag } from "@/feature-flags";
import { cn } from "@/lib/utils";
import type { AccountSession } from "./useSession";

/**
 * Signed-in account view: identity, plan, sign-out, and the project-sync
 * master switch. Password management (change / reset) lives on the Cloud
 * website.
 */
export function AccountSignedIn({ session }: { session: AccountSession }) {
  const { signOut } = useAuth();
  const projectSyncEnabled = useCloudPrefs((s) => s.projectSyncEnabled);
  const setProjectSyncEnabled = useCloudPrefs((s) => s.setProjectSyncEnabled);
  const syncFeatureEnabled = useFeatureFlag("cloud.sync");

  const planLabel = session.tier === "pro" ? "Pro" : "Free";

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-medium text-text-strong">
          Account
        </h2>
        <p className="mt-1 text-sm text-text-tertiary">
          Signed in to OpenPCB Cloud.
        </p>
      </header>

      <div className="rounded-control border border-border bg-surface-panel px-4 py-[14px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-text-strong">
              <span className="text-text-tertiary">
                Signed in as{" "}
              </span>
              <span className="font-medium">{session.email}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CircleCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              Plan: <span className="font-medium">{planLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="h-9 shrink-0 cursor-pointer rounded-control border border-border-control px-3 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
          >
            Sign out
          </button>
        </div>
      </div>

      {syncFeatureEnabled && (
        <section className="rounded-control border border-border bg-surface-panel px-4 py-[14px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-strong">
                Sync projects to cloud
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                When on, your designs sync to your OpenPCB Cloud workspace. Turn
                off to keep all project data on this machine.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={projectSyncEnabled}
              aria-label="Sync projects to cloud"
              onClick={() => setProjectSyncEnabled(!projectSyncEnabled)}
              className={cn(
                "relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                projectSyncEnabled
                  ? "bg-primary"
                  : "bg-surface-control",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  projectSyncEnabled ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
