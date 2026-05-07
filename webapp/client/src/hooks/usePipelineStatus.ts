import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "./useSettings";

export type PipelineStatus = "DEPLOYED" | "ACTIVATING" | "INACTIVE" | "FAILED" | "UNKNOWN" | "CHECKING";

export interface PipelineStatusInfo {
  status: PipelineStatus;
  message: string;
  canChat: boolean;
}

const STATUS_MESSAGES: Record<PipelineStatus, string> = {
  DEPLOYED:  "Pipeline is active — ready to chat",
  ACTIVATING:"Pipeline is starting up — this takes about 60 seconds",
  INACTIVE:  "Pipeline is inactive — click to activate",
  FAILED:    "Pipeline failed to deploy — check the AI@EC Platform",
  UNKNOWN:   "Pipeline status unknown",
  CHECKING:  "Checking pipeline status...",
};

const POLL_INTERVAL_ACTIVATING = 5000;  // poll every 5s while activating
const POLL_INTERVAL_DEPLOYED   = 60000; // re-check every 60s when deployed

export function usePipelineStatus() {
  const { settings } = useSettings();
  const [info, setInfo] = useState<PipelineStatusInfo>({
    status: "CHECKING",
    message: STATUS_MESSAGES["CHECKING"],
    canChat: false,
  });
  const [activating, setActivating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
  };

  const checkStatus = useCallback(async (scheduleNext = true): Promise<PipelineStatus> => {
    try {
      const res = await fetch(
        "/api/status?workspace=" + encodeURIComponent(settings.workspace) +
        "&pipeline=" + encodeURIComponent(settings.pipeline)
      );
      if (!res.ok) {
        setInfo({ status: "UNKNOWN", message: "Could not reach the server.", canChat: false });
        return "UNKNOWN";
      }
      const json = await res.json();
      const status: PipelineStatus = json.status || "UNKNOWN";

      setInfo({
        status,
        message: STATUS_MESSAGES[status] || "Status: " + status,
        canChat: status === "DEPLOYED",
      });

      if (scheduleNext) {
        clearPoll();
        if (status === "ACTIVATING") {
          pollRef.current = setTimeout(() => checkStatus(true), POLL_INTERVAL_ACTIVATING);
        } else if (status === "DEPLOYED") {
          pollRef.current = setTimeout(() => checkStatus(true), POLL_INTERVAL_DEPLOYED);
        }
        // INACTIVE / FAILED / UNKNOWN — no auto-polling, wait for user action
      }

      return status;
    } catch {
      setInfo({ status: "UNKNOWN", message: "Could not reach the server.", canChat: false });
      return "UNKNOWN";
    }
  }, [settings.workspace, settings.pipeline]);

  const activate = useCallback(async () => {
    if (activating) return;
    setActivating(true);
    setInfo({ status: "ACTIVATING", message: STATUS_MESSAGES["ACTIVATING"], canChat: false });

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace: settings.workspace, pipeline: settings.pipeline }),
      });
      const json = await res.json();
      if (json.status === "DEPLOYED") {
        setInfo({ status: "DEPLOYED", message: STATUS_MESSAGES["DEPLOYED"], canChat: true });
      } else {
        // Start polling
        pollRef.current = setTimeout(() => checkStatus(true), POLL_INTERVAL_ACTIVATING);
      }
    } catch {
      setInfo({ status: "UNKNOWN", message: "Could not activate the pipeline.", canChat: false });
    } finally {
      setActivating(false);
    }
  }, [settings.workspace, settings.pipeline, activating, checkStatus]);

  // Check on mount and whenever workspace/pipeline changes
  useEffect(() => {
    clearPoll();
    checkStatus(true);
    return clearPoll;
  }, [settings.workspace, settings.pipeline]);

  return { info, activating, checkStatus, activate };
}
