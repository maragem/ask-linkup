import React, { useState } from "react";
import { useSettings, Settings } from "../hooks/useSettings";

function Field({ label, hint, value, onChange, placeholder, mono }: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean;
}) {
  return (
    <div style={{ marginBottom: "var(--space-6)" }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: "0.875rem", color: "var(--gray-900)", marginBottom: "var(--space-1)" }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", fontSize: "0.875rem", fontFamily: mono ? "var(--font-mono)" : "inherit", color: "var(--gray-900)", background: "var(--white)", outline: "none", transition: "border-color 0.15s" }}
        onFocus={e => { e.target.style.borderColor = "var(--ec-blue)"; }}
        onBlur={e => { e.target.style.borderColor = "var(--gray-200)"; }} />
      <p style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginTop: "var(--space-1)", lineHeight: 1.5 }}>{hint}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Settings>({ ...settings });

  const patch = (key: keyof Settings) => (v: string) => setDraft(d => ({ ...d, [key]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    update(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ec-blue-dark)", marginBottom: "var(--space-2)" }}>Settings</h1>
        <p style={{ color: "var(--gray-600)", fontSize: "0.9rem" }}>Configure the AI@EC Platform pipeline connection. All other credentials are managed server-side.</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "var(--space-6)" }}>
          <div style={{ background: "var(--ec-blue-light)", borderBottom: "1px solid var(--gray-200)", padding: "var(--space-4) var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="var(--ec-blue)" strokeWidth="1.5"/><path d="M6 7h8M6 10h5M6 13h7" stroke="var(--ec-blue)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ec-blue-dark)" }}>AI@EC Platform — Pipeline connection</h2>
          </div>
          <div style={{ padding: "var(--space-6)" }}>
            <div style={{ background: "var(--ec-blue-light)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--ec-blue)", padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-5)", fontSize: "0.82rem", color: "var(--gray-700)", lineHeight: 1.6 }}>
              The workspace and pipeline names tell the app which Haystack Enterprise pipeline to call. All API keys (AI@EC Platform, GPT@EC, and Linkup) are managed server-side and are not required here.
            </div>
            <Field label="Workspace name" hint='The Haystack Enterprise workspace name as shown in the AI@EC Platform.' value={draft.workspace} onChange={patch("workspace")} placeholder="Test" mono />
            <Field label="Pipeline name" hint="The exact pipeline name as configured in your workspace. Case-sensitive." value={draft.pipeline} onChange={patch("pipeline")} placeholder="Tutorial_MCP_LinkUP" mono />
          </div>
        </div>

        <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-4) var(--space-5)", marginBottom: "var(--space-6)", fontSize: "0.82rem", color: "var(--gray-600)", lineHeight: 1.7 }}>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M8 1L2 4v4c0 3.31 2.55 6.41 6 7 3.45-.59 6-3.69 6-7V4L8 1z" stroke="var(--ec-blue)" strokeWidth="1.3" strokeLinejoin="round"/></svg>
            <div>
              <strong style={{ color: "var(--gray-900)" }}>Credentials managed securely:</strong>
              <ul style={{ marginTop: "var(--space-2)", paddingLeft: "var(--space-4)" }}>
                <li><strong>AI@EC Platform API key</strong> — set as a Railway environment variable</li>
                <li><strong>GPT@EC LLM key</strong> — configured in the pipeline YAML by the AI engineer</li>
                <li><strong>Linkup API key</strong> — stored as a workspace secret in the AI@EC Platform</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", justifyContent: "flex-end" }}>
          {saved && (
            <span style={{ color: "var(--success)", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Settings saved
            </span>
          )}
          <button type="submit" style={{ background: "var(--ec-blue)", color: "var(--white)", border: "none", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-8)", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ec-blue-dark)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ec-blue)"; }}>
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
