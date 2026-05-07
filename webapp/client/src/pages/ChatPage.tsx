import React, { useEffect, useRef, useState, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat, Conversation } from "../hooks/useChat";
import { usePipelineStatus } from "../hooks/usePipelineStatus";
import PipelineStatusBar from "../components/PipelineStatusBar";

const SUGGESTED = [
  "What are the latest EU AI policy developments this week?",
  "Search for the current European Commission priorities for 2025.",
  "What is the current price of energy in Europe and recent trends?",
  "Find and summarise the latest ENISA cybersecurity threat report.",
  "What are the main outcomes of the most recent European Council meeting?",
  "Search for recent news about the EU Digital Decade 2030 targets.",
];

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--ec-blue)", animation: "pulse 1.2s ease-in-out infinite", animationDelay: i * 0.2 + "s" }} />
      ))}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:0.2;transform:scale(0.9)}40%{opacity:1;transform:scale(1)}}`}</style>
    </span>
  );
}

function SourceChip({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--linkup-teal)", background: "var(--linkup-teal-light)", border: "1px solid var(--linkup-teal)", borderRadius: "20px", padding: "2px 10px", textDecoration: "none", marginRight: 4, marginBottom: 4, fontWeight: 500 }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {label}
    </a>
  );
}

function extractSources(content: string) {
  const regex = /https?:\/\/[^\s\)\]"<>]+/g;
  const matches = [...new Set(content.match(regex) ?? [])];
  return matches.slice(0, 6).map(url => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return { url, label: domain };
    } catch { return { url, label: url.slice(0, 30) }; }
  });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return diffDays + " days ago";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function HistoryPanel({ history, onLoad, onDelete, onClearAll, onClose }: {
  history: Conversation[]; onLoad: (c: Conversation) => void;
  onDelete: (id: string) => void; onClearAll: () => void; onClose: () => void;
}) {
  return (
    <div style={{ width: 300, flexShrink: 0, background: "var(--white)", borderLeft: "1px solid var(--gray-200)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--gray-200)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--ec-blue-light)" }}>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ec-blue-dark)" }}>Chat history</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-600)", padding: 4, display: "flex", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3)" }}>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8) var(--space-4)", color: "var(--gray-400)", fontSize: "0.85rem" }}>No conversations yet.<br />Start chatting to build your history.</div>
        ) : history.map(conv => (
          <div key={conv.id} style={{ borderRadius: "var(--radius-md)", marginBottom: "var(--space-2)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
            <button onClick={() => onLoad(conv)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "var(--space-3) var(--space-4)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ec-blue-light)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gray-900)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{conv.title}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>{formatDate(conv.createdAt)} · {conv.messages.filter(m => m.role === "user").length} questions</span>
            </button>
            <div style={{ borderTop: "1px solid var(--gray-100)", padding: "var(--space-1) var(--space-3)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => onDelete(conv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 3, padding: "2px 4px", fontFamily: "inherit" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--gray-400)"; }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4 3v7h4V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {history.length > 0 && (
        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--gray-200)" }}>
          <button onClick={onClearAll} style={{ width: "100%", background: "none", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-4)", color: "var(--gray-600)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--danger)"; (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-200)"; (e.currentTarget as HTMLElement).style.color = "var(--gray-600)"; }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5h3v1M3.5 3.5V11h6V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Clear all history
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { messages, streaming, activeTool, sendMessage, stop, newChat, history, loadConversation, deleteConversation, clearHistory } = useChat();
  const { info, activating, checkStatus, activate } = usePipelineStatus();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - var(--header-height) - var(--topbar-height))", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        <PipelineStatusBar status={info.status} message={info.message} activating={activating} onActivate={activate} onRefresh={() => checkStatus(true)} />

        {/* Toolbar */}
        <div style={{ borderBottom: "1px solid var(--gray-200)", background: "var(--white)", padding: "var(--space-3) var(--space-5)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button onClick={() => { newChat(); setInput(""); }} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "var(--ec-blue)", color: "var(--white)", border: "none", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-4)", fontSize: "0.825rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ec-blue-dark)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ec-blue)"; }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New chat
            </button>
            {messages.length > 0 && <span style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>{messages.filter(m => m.role === "user").length} question{messages.filter(m => m.role === "user").length !== 1 ? "s" : ""}</span>}
          </div>
          <button onClick={() => setHistoryOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: historyOpen ? "var(--ec-blue-light)" : "none", border: "1px solid " + (historyOpen ? "var(--ec-blue)" : "var(--gray-200)"), borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-4)", fontSize: "0.825rem", fontWeight: historyOpen ? 700 : 400, color: historyOpen ? "var(--ec-blue)" : "var(--gray-600)", cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7 4.5V7l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            History
            {history.length > 0 && <span style={{ background: "var(--ec-blue)", color: "var(--white)", borderRadius: "20px", fontSize: "0.7rem", padding: "1px 6px", fontWeight: 700 }}>{history.length}</span>}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: "var(--space-12)" }}>
                <div style={{ width: 72, height: 72, borderRadius: "var(--radius-lg)", background: "var(--ec-blue)", margin: "0 auto var(--space-5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                    <circle cx="19" cy="15" r="7" fill="none" stroke="var(--ec-yellow)" strokeWidth="2.5"/>
                    <path d="M7 33c0-6.63 5.37-12 12-12s12 5.37 12 12" fill="none" stroke="var(--ec-yellow)" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ec-blue-dark)", marginBottom: "var(--space-3)" }}>Ask LinkUP</h1>
                <p style={{ color: "var(--gray-600)", maxWidth: 480, margin: "0 auto var(--space-8)", fontSize: "0.95rem" }}>
                  Your real-time web research assistant. Ask about current events, news, reports, and any topic — powered by the Linkup AI search API and the AI@EC Platform.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-3)", textAlign: "left" }}>
                  {SUGGESTED.map((q, i) => (
                    <button key={i} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                      style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", textAlign: "left", cursor: "pointer", color: "var(--gray-800)", fontSize: "0.875rem", lineHeight: 1.5, boxShadow: "var(--shadow-sm)", fontFamily: "inherit" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ec-blue)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-200)"; }}>
                      <span style={{ color: "var(--linkup-teal)", fontWeight: 700, display: "block", marginBottom: 4, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Example</span>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {messages.map(msg => {
                  const sources = msg.role === "assistant" ? extractSources(msg.content) : [];
                  const isLastAssistant = msg.role === "assistant" && msg.id === [...messages].reverse().find(m => m.role === "assistant")?.id;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.role === "assistant" && (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--ec-blue)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginRight: "var(--space-3)", marginTop: 2 }}>
                          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                            <circle cx="8.5" cy="6" r="3.5" fill="none" stroke="var(--ec-yellow)" strokeWidth="1.6"/>
                            <path d="M3 15c0-3.04 2.46-5.5 5.5-5.5S14 11.96 14 15" fill="none" stroke="var(--ec-yellow)" strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                      <div style={{ maxWidth: msg.role === "user" ? "72%" : "88%", background: msg.role === "user" ? "var(--ec-blue)" : "var(--white)", color: msg.role === "user" ? "var(--white)" : "var(--gray-900)", border: msg.role === "assistant" ? "1px solid var(--gray-200)" : "none", borderRadius: msg.role === "user" ? "var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)" : "var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)", padding: "var(--space-4) var(--space-5)", boxShadow: "var(--shadow-sm)", ...(msg.error && { background: "#fff5f5", borderColor: "#ffa0a0", color: "var(--danger)" }) }}>
                        {msg.role === "assistant" ? (
                          <>
                            {!msg.content && isLastAssistant && streaming && (
                              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "0.8rem", color: "var(--linkup-teal)", background: "var(--linkup-teal-light)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)", border: "1px solid rgba(0,180,166,0.2)", marginBottom: "var(--space-2)" }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--linkup-teal)", animation: "pulse 1s ease-in-out infinite", flexShrink: 0 }} />
                                {activeTool || "Thinking..."}
                              </div>
                            )}
                            {!msg.content && isLastAssistant && streaming && !activeTool && <TypingDots />}
                            {msg.content && <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>}
                            {sources.length > 0 && msg.content && (
                              <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--gray-100)" }}>
                                <div style={{ fontSize: "0.72rem", color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-2)" }}>Sources</div>
                                <div style={{ display: "flex", flexWrap: "wrap" }}>
                                  {sources.map(s => <SourceChip key={s.url} url={s.url} label={s.label} />)}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{msg.content}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid var(--gray-200)", background: "var(--white)", padding: "var(--space-4) var(--space-6)", boxShadow: "0 -2px 8px rgba(0,51,153,0.06)", flexShrink: 0 }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: "var(--space-2) var(--space-3)" }}>
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={info.canChat ? "Ask anything — search the web, fetch a URL, find current news..." : "Waiting for pipeline to become active..."}
                rows={1} disabled={streaming || !info.canChat}
                style={{ flex: 1, border: "none", background: "transparent", resize: "none", outline: "none", fontSize: "0.95rem", lineHeight: 1.6, color: "var(--gray-900)", padding: "var(--space-2)", maxHeight: 160, overflowY: "auto", fontFamily: "inherit" }}
                onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }} />
              <button type={streaming ? "button" : "submit"} onClick={streaming ? stop : undefined} disabled={!streaming && (!input.trim() || !info.canChat)}
                style={{ background: streaming ? "var(--danger)" : "var(--ec-blue)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-4)", color: "var(--white)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "var(--space-2)", opacity: (!streaming && (!input.trim() || !info.canChat)) ? 0.45 : 1, minWidth: 80, justifyContent: "center", fontFamily: "inherit" }}>
                {streaming ? (
                  <><svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="2" y="2" width="9" height="9" rx="1" /></svg>Stop</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 11L11 6.5 2 2v3.5l6 1-6 1V11z" fill="currentColor" /></svg>Send</>
                )}
              </button>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--gray-400)", textAlign: "center", marginTop: "var(--space-2)" }}>
              Powered by AI@EC Platform · Unit DIGIT.B1 – Data, Artificial Intelligence & Web · Enter to send, Shift+Enter for new line
            </div>
          </form>
        </div>
      </div>

      {historyOpen && <HistoryPanel history={history} onLoad={conv => { loadConversation(conv); setHistoryOpen(false); }} onDelete={deleteConversation} onClearAll={clearHistory} onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}
