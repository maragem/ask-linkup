import React from "react";

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--ec-blue-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "var(--ec-blue)" }}>{icon}</span>
        </div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ec-blue-dark)" }}>{title}</h3>
      </div>
      <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}>
      <div style={{ background: "var(--ec-blue)", borderRadius: "var(--radius-lg)", padding: "var(--space-10) var(--space-8)", marginBottom: "var(--space-8)", color: "var(--white)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,204,0,0.08)" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", background: "var(--ec-yellow)", color: "var(--ec-blue)", borderRadius: "20px", padding: "var(--space-1) var(--space-3)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "var(--space-4)", textTransform: "uppercase" }}>
            AI@EC Platform · Tutorial
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "var(--space-4)", lineHeight: 1.2 }}>Ask LinkUP</h1>
          <p style={{ fontSize: "1.05rem", opacity: 0.85, maxWidth: 580, lineHeight: 1.7 }}>
            A real-time web research assistant for European Commission staff, powered by the AI@EC Platform (Haystack Enterprise), the GPT@EC language model, and the Linkup AI-powered web search API.
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ec-blue-dark)", marginBottom: "var(--space-5)" }}>What it does</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <Card icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} title="Real-time web search">
          Ask questions about current events, news, prices, or any topic. The Linkup search engine retrieves live results from trusted sources across the web.
        </Card>
        <Card icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} title="Full page extraction">
          Provide any URL and the assistant will fetch and summarise the complete page content — articles, pricing tables, job listings, reports.
        </Card>
        <Card icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} title="Always up to date">
          Unlike standard AI assistants, Ask LinkUP retrieves information in real time. No training data cutoff — answers reflect what is on the web today.
        </Card>
      </div>

      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ec-blue-dark)", marginBottom: "var(--space-5)" }}>Architecture</h2>
      <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        {[
          { n: "1", title: "Web app (Railway)", desc: "React + Express. This UI. Proxies requests to Deepset Cloud, keeping the API key server-side." },
          { n: "2", title: "AI@EC Platform (Haystack Enterprise)", desc: 'Hosts the pipeline: history_parser → agent → answer_builder. Workspace "Test", pipeline "Tutorial_MCP_LinkUP".' },
          { n: "3", title: "GPT@EC LLM", desc: "The Commission's internal LLM at api.tech.ec.europa.eu/ecgpt/v1. The agent uses it to reason and orchestrate tool calls." },
          { n: "4", title: "Linkup MCP Server", desc: "Hosted by Linkup at mcp.linkup.so/mcp. Provides two tools: linkup-search (web search) and linkup-fetch (page extraction). Requires a Linkup API key." },
          { n: "5", title: "The live web", desc: "Linkup retrieves real-time results from the public internet — news sites, company pages, official sources." },
        ].map(({ n, title, desc }) => (
          <div key={n} style={{ display: "flex", gap: "var(--space-4)", paddingBottom: "var(--space-5)", borderBottom: n !== "5" ? "1px solid var(--gray-100)" : "none", marginBottom: n !== "5" ? "var(--space-5)" : 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ec-blue)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{n}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--gray-900)", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--gray-600)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ec-blue-dark)", marginBottom: "var(--space-5)" }}>Linkup tools</h2>
      <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "var(--space-8)" }}>
        {[
          { name: "linkup-search", desc: "Search the web in real time. Supports standard depth (parallel searches, one URL scrape) and deep depth (iterative multi-URL retrieval and chaining)." },
          { name: "linkup-fetch", desc: "Fetch and extract the full content of a specific URL as Markdown. Use when you have a known page to read." },
        ].map((t, i) => (
          <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)", borderBottom: i === 0 ? "1px solid var(--gray-100)" : "none" }}>
            <code style={{ background: "var(--linkup-teal-light)", color: "var(--linkup-teal)", padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "0.78rem", fontFamily: "var(--font-mono)", flexShrink: 0, marginTop: 1, border: "1px solid rgba(0,180,166,0.3)" }}>{t.name}</code>
            <span style={{ fontSize: "0.875rem", color: "var(--gray-600)", lineHeight: 1.6 }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--ec-blue-light)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--ec-blue)", padding: "var(--space-4) var(--space-5)", fontSize: "0.82rem", color: "var(--gray-700)", lineHeight: 1.7 }}>
        <strong>Tutorial note:</strong> This application demonstrates how to integrate an externally-hosted MCP server (Linkup) with the AI@EC Platform without deploying any additional infrastructure. The only deployment required is this web app on Railway.
      </div>
    </div>
  );
}
