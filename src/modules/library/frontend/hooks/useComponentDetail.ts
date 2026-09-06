import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ComponentDetailPayload } from "../types";
import { toUserError } from "../utils";

interface UseComponentDetailParams {
  backendURL: string | null | undefined;
  moduleId: string;
  /** `null` parks the hook in an idle state (nothing selected). */
  componentId: string | null;
  refreshToken?: number;
}

export interface UseComponentDetailResult {
  detail: ComponentDetailPayload | null;
  loading: boolean;
  error: string | null;
  /** Lets callers patch the payload in place after a successful save. */
  setDetail: Dispatch<SetStateAction<ComponentDetailPayload | null>>;
}

/**
 * Fetches `GET /api/modules/{moduleId}/components/{id}/detail`. Shared by the
 * full detail page and the library preview pane so both read one payload shape
 * through one request path.
 */
export function useComponentDetail({
  backendURL,
  moduleId,
  componentId,
  refreshToken = 0,
}: UseComponentDetailParams): UseComponentDetailResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ComponentDetailPayload | null>(null);

  useEffect(() => {
    if (!componentId) {
      setLoading(false);
      setError(null);
      setDetail(null);
      return;
    }

    if (!backendURL) {
      setLoading(false);
      setError("Backend URL unavailable");
      setDetail(null);
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${backendURL}/api/modules/${moduleId}/components/${componentId}/detail`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { detail?: ComponentDetailPayload };
          error?: string;
        };
        if (!response.ok || !payload.ok || !payload.data?.detail) {
          throw new Error(
            toUserError(
              payload,
              `Detail fetch failed (HTTP ${response.status})`,
            ),
          );
        }
        setDetail(payload.data.detail);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        setDetail(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load component detail",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => controller.abort();
  }, [backendURL, componentId, moduleId, refreshToken]);

  return { detail, loading, error, setDetail };
}
