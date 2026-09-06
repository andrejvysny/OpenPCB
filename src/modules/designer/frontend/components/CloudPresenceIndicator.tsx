import { useEffect, useState, type ReactElement } from "react";
import { useCloudPresence } from "@/cloud/use-presence";

interface CloudPresenceIndicatorProps {
  designId: string | null;
  api: {
    getCloudLink(designId: string): Promise<{
      link: { cloudDesignId: string } | null;
    }>;
  };
}

export function CloudPresenceIndicator({
  designId,
  api,
}: CloudPresenceIndicatorProps): ReactElement | null {
  const [cloudDesignId, setCloudDesignId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!designId) {
      setCloudDesignId(null);
      return;
    }
    void api
      .getCloudLink(designId)
      .then(({ link }) => {
        if (!cancelled) setCloudDesignId(link?.cloudDesignId ?? null);
      })
      .catch(() => {
        if (!cancelled) setCloudDesignId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [designId, api]);

  const { peers } = useCloudPresence(cloudDesignId);

  if (!cloudDesignId || peers.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1"
      title={`${peers.length} other viewer(s)`}
    >
      {peers.slice(0, 4).map((peer) => {
        const initial = (peer.email ?? peer.userId).slice(0, 1).toUpperCase();
        return (
          <span
            key={peer.userId}
            className="flex h-4 w-4 items-center justify-center rounded-full text-2xs font-medium text-white ring-1 ring-surface-rail"
            style={{ backgroundColor: peer.color }}
            title={peer.email ?? peer.userId}
          >
            {initial}
          </span>
        );
      })}
      {peers.length > 4 && (
        <span className="text-2xs text-text-tertiary">+{peers.length - 4}</span>
      )}
    </div>
  );
}
