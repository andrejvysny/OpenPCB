import { useEffect } from "react";
import { useBootstrap } from "./providers/BootstrapProvider";
import { LeftSidebar } from "./components/LeftSidebar";
import { TitleBar } from "./components/TitleBar";
import { AppRouter } from "./AppRouter";
import { AppContextMenu } from "./components/AppContextMenu";
import { useNavigationStore } from "./stores/navigation-store";
import { useSettingsHotkeys } from "./settings/hooks/useSettingsHotkeys";
import { openContextMenu } from "@shared/frontend/context-menu";

function LoadingScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-app text-sm text-text-secondary">
      Initializing OpenPCB...
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-app p-6">
      <div className="max-w-xl rounded-control border border-status-danger/30 bg-status-danger-soft px-4 py-3 text-sm text-status-danger">
        {message}
      </div>
    </div>
  );
}

export function AppShell() {
  const { status, error } = useBootstrap();
  const openSettings = useNavigationStore((state) => state.openSettings);

  useSettingsHotkeys();

  useEffect(() => {
    const suppressNativeContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", suppressNativeContextMenu, true);
    return () =>
      document.removeEventListener(
        "contextmenu",
        suppressNativeContextMenu,
        true,
      );
  }, []);

  if (status === "loading" || status === "idle") {
    return <LoadingScreen />;
  }

  if (status === "error") {
    return <ErrorScreen message={error ?? "Failed to bootstrap app"} />;
  }

  return (
    <>
      <div className="flex h-full w-full flex-col bg-surface-app text-text">
        <TitleBar />
        <div
          className="grid min-h-0 flex-1 grid-cols-[80px_1fr]"
          onContextMenu={(event) => {
            event.preventDefault();
            openContextMenu({
              scope: "app",
              position: { x: event.clientX, y: event.clientY },
              title: "OpenPCB",
              groups: [
                {
                  id: "app",
                  items: [
                    {
                      kind: "action",
                      id: "settings",
                      label: "Settings",
                      shortcut: "Ctrl+,",
                      onSelect: () => openSettings(),
                    },
                  ],
                },
              ],
            });
          }}
        >
          <LeftSidebar onSettingsClick={() => openSettings()} />
          <main className="h-full min-h-0 min-w-0">
            <AppRouter />
          </main>
        </div>
      </div>
      <AppContextMenu />
    </>
  );
}
