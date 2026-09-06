import { CircleDot, CloudOff, LayoutGrid, Settings } from "lucide-react";
import { Tooltip, TooltipProvider } from "@shared/frontend/ui/tooltip";
import { useAuth } from "../cloud/AuthProvider";
import { useNavigationStore } from "../stores/navigation-store";
import { useBootstrap } from "../providers/BootstrapProvider";
import type { ModuleRegistryItem } from "../../../contracts/modules/registry";
import { resolveLucideIcon } from "./icon-resolver";
import { getFrontendModuleEntry } from "./ModuleSpaceHost";

interface LeftSidebarProps {
  onSettingsClick: () => void;
}

function navButtonClass(active: boolean): string {
  return `flex ${active ? "w-16 bg-surface-hover text-text-strong" : "w-[72px] text-text-tertiary hover:bg-surface-hover/60 hover:text-text"} cursor-pointer flex-col items-center gap-1 rounded-control py-2 pb-1.5 transition-colors`;
}

function navLabelClass(active: boolean): string {
  return `text-2xs leading-tight text-center ${active ? "font-medium" : ""}`;
}

export function LeftSidebar({ onSettingsClick }: LeftSidebarProps) {
  const currentRoute = useNavigationStore((state) => state.currentRoute);
  const navigateHome = useNavigationStore((state) => state.navigateHome);
  const navigateToModule = useNavigationStore(
    (state) => state.navigateToModule,
  );
  const { moduleRegistry } = useBootstrap();
  // Same gate the designer header uses: no cloud config, or cloud configured
  // but not signed in, means this session is local-only.
  const { enabled: cloudEnabled, session } = useAuth();
  const localOnly = !cloudEnabled || !session;

  const loadedModules = (moduleRegistry?.modules ?? []).filter(
    (module: ModuleRegistryItem) => {
      if (module.status !== "loaded" || module.sidebar.hidden === true) {
        return false;
      }
      // Defense in depth: even if the backend reports a dev-only module as
      // loaded (e.g. a stale registry response), never expose it from a
      // production build.
      if (import.meta.env.PROD) {
        const entry = getFrontendModuleEntry(module.id);
        if (entry?.manifest.availability === "dev") {
          return false;
        }
      }
      return true;
    },
  );

  const orderedModules = [...loadedModules].sort((a, b) => {
    if (a.sidebar.order !== b.sidebar.order) {
      return a.sidebar.order - b.sidebar.order;
    }
    return a.sidebar.label.localeCompare(b.sidebar.label);
  });

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-20 flex-col items-center justify-between border-r border-border bg-surface-rail py-2.5">
        <div className="w-10 h-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            ></rect>
            <line
              x1="8"
              y1="8"
              x2="16"
              y2="16"
              stroke="currentColor"
              strokeWidth="1.5"
            ></line>
            <circle cx="8" cy="8" r="1.5" fill="currentColor"></circle>
            <circle cx="16" cy="8" r="1.5" fill="currentColor"></circle>
            <circle cx="8" cy="16" r="1.5" fill="currentColor"></circle>
            <circle cx="16" cy="16" r="1.5" fill="currentColor"></circle>
          </svg>
        </div>

        <nav className="flex flex-1 flex-col items-center justify-start pt-6">
          <button
            type="button"
            className={navButtonClass(currentRoute.kind === "home")}
            aria-label="Home"
            onClick={navigateHome}
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
            <span className={navLabelClass(currentRoute.kind === "home")}>
              Home
            </span>
          </button>

          <div className="mt-3 flex w-full flex-col items-center gap-2">
            {orderedModules.map((module: ModuleRegistryItem) => {
              const active =
                currentRoute.kind === "module" &&
                currentRoute.moduleId === module.id;
              const ModuleIcon = resolveLucideIcon(module.sidebar.icon);
              return (
                <button
                  key={module.id}
                  type="button"
                  title={module.sidebar.label}
                  className={navButtonClass(active)}
                  aria-label={module.sidebar.label}
                  onClick={() => navigateToModule(module.id)}
                >
                  <ModuleIcon className="h-5 w-5" strokeWidth={1.5} />
                  <span className={navLabelClass(active)}>
                    {module.sidebar.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex flex-col items-center gap-2">
          {localOnly ? (
            <Tooltip label="Local only — not signed in" side="right">
              <span
                role="img"
                aria-label="Local only — not signed in"
                className="flex h-8 w-8 items-center justify-center text-text-tertiary"
              >
                <CloudOff className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </Tooltip>
          ) : null}
          <Tooltip label="Report a bug or request a feature" side="right">
            <a
              href="https://github.com/andrejvysny/OpenPCB/issues/new"
              target="_blank"
              rel="noreferrer"
              aria-label="Report a bug or request a feature"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-control text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
            >
              <CircleDot className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </a>
          </Tooltip>
          <button
            type="button"
            aria-label="Settings"
            aria-current={currentRoute.kind === "settings" ? "page" : undefined}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-control transition-colors hover:bg-surface-hover ${
              currentRoute.kind === "settings"
                ? "text-text-strong"
                : "text-text-tertiary hover:text-text"
            }`}
            onClick={onSettingsClick}
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
