import React from "react";
import { PipelineStatus } from "../hooks/usePipelineStatus";

interface Props {
  status: PipelineStatus;
  message: string;
  activating: boolean;
  onActivate: () => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<PipelineStatus, { dot: string; bg: string; border: string; text: string }> = {
  DEPLOYED:  { dot: "#22c55e", bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  ACTIVATING:{ dot: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", text: "#92400e" },
  INACTIVE:  { dot: "#ef4444", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
  FAILED:    { dot: "#dc2626", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
  UNKNOWN:   { dot: "#9ca3af", bg: "#f9fafb", border: "#d1d5db", text: "#4b5563" },
  CHECKING:  { dot: "#60a5fa", bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" },
};

function PulsingDot({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      <span style={{
        position: "absolute", display: "inline-flex", width: "100%", height: "100%",
        borderRadius: "50%", background: color, opacity: 0.4,
        animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, borderRadius: "50%", background: color }} />
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
    </span>
  );
}

function StaticDot({ color }: { color: string }) {
  return <span style={{ display: "inline-flex", width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

export default function PipelineStatusBar({ status, message, activating, onActivate, onRefresh }: Props) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["UNKNOWN"];
  const isAnimated = status === "ACTIVATING" || status === "CHECKING";

  return (
    <div style={{
      background: c.bg,
      borderBottom: "1px solid " + c.border,
      padding: "var(--space-2) var(--space-6)",
      display: "flex", alignItems: "center", gap: "var(--space-3)",
      fontSize: "0.8rem", color: c.text,
    }}>
      {isAnimated
        ? <PulsingDot color={c.dot} />
        : <StaticDot color={c.dot} />
      }

      <span style={{ flex: 1 }}>
        <strong>Pipeline status:</strong> {message}
      </span>

      {/* Activate button — shown when inactive */}
      {status === "INACTIVE" && (
        <button
          onClick={onActivate}
          disabled={activating}
          style={{
            background: "#003399", color: "#fff",
            border: "none", borderRadius: "var(--radius-sm)",
            padding: "var(--space-1) var(--space-4)",
            fontSize: "0.78rem", fontWeight: 700,
            cursor: activating ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: activating ? 0.6 : 1,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L9.5 6 4 9.5V2.5z" fill="currentColor"/>
          </svg>
          {activating ? "Activating..." : "Activate pipeline"}
        </button>
      )}

      {/* Retry button — shown on failure or unknown */}
      {(status === "FAILED" || status === "UNKNOWN") && (
        <button
          onClick={onRefresh}
          style={{
            background: "none", color: c.text,
            border: "1px solid " + c.border, borderRadius: "var(--radius-sm)",
            padding: "var(--space-1) var(--space-3)",
            fontSize: "0.78rem", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Retry
        </button>
      )}

      {/* Spinner while activating */}
      {status === "ACTIVATING" && (
        <span style={{ fontSize: "0.75rem", color: c.text, opacity: 0.8 }}>
          Checking every 5s...
        </span>
      )}
    </div>
  );
}
