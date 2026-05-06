import { useState, useCallback, useRef } from "react";
import { useSettings } from "./useSettings";

export interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  error?:    boolean;
}

export interface Conversation {
  id:        string;
  title:     string;
  messages:  Message[];
  createdAt: number;
}

const HISTORY_KEY = "ask-linkup:history";

function uid() { return Math.random().toString(36).slice(2); }

function loadHistory(): Conversation[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveHistory(history: Conversation[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

export function useChat() {
  const { settings } = useSettings();
  const [messages, setMessages]   = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("");
  const [history, setHistory]     = useState<Conversation[]>(loadHistory);
  const abortRef                  = useRef<AbortController | null>(null);
  const currentConvIdRef          = useRef<string>(uid());

  const sendMessage = useCallback(async (userText: string) => {
    if (streaming) return;

    const userMsg: Message      = { id: uid(), role: "user", content: userText };
    const assistantId           = uid();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    setActiveTool("Searching the web");

    const allMessages = [...messages, userMsg];
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages:  allMessages.map(m => ({ role: m.role, content: m.content })),
          workspace: settings.workspace,
          pipeline:  settings.pipeline,
        }),
      });

      setActiveTool("");

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "HTTP " + res.status }));
        setMessages(prev => prev.map(m => m.id === assistantId
          ? { ...m, content: "Error: " + (err.error || "Request failed"), error: true }
          : m));
        return;
      }

      const json = await res.json();
      const answer = json.answer || "No response received.";

      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: answer } : m));

      const finalMessages: Message[] = [
        ...allMessages,
        { id: assistantId, role: "assistant", content: answer },
      ];
      const convId    = currentConvIdRef.current;
      const convTitle = userText.slice(0, 60) + (userText.length > 60 ? "..." : "");

      setHistory(prev => {
        const existing = prev.find(c => c.id === convId);
        const updated: Conversation = {
          id:        convId,
          title:     existing?.title ?? convTitle,
          messages:  finalMessages,
          createdAt: existing?.createdAt ?? Date.now(),
        };
        const next = [updated, ...prev.filter(c => c.id !== convId)];
        saveHistory(next);
        return next;
      });

    } catch (err: any) {
      setActiveTool("");
      if (err.name === "AbortError") return;
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: "Connection error: " + err.message, error: true }
        : m));
    } finally {
      setStreaming(false);
      setActiveTool("");
      abortRef.current = null;
    }
  }, [messages, settings, streaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setActiveTool("");
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setActiveTool("");
    currentConvIdRef.current = uid();
  }, []);

  const loadConversation = useCallback((conv: Conversation) => {
    setMessages(conv.messages);
    setActiveTool("");
    currentConvIdRef.current = conv.id;
  }, []);

  const deleteConversation = useCallback((convId: string) => {
    setHistory(prev => {
      const next = prev.filter(c => c.id !== convId);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { messages, streaming, activeTool, sendMessage, stop, newChat, history, loadConversation, deleteConversation, clearHistory };
}
