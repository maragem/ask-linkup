import React from "react";
import { Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./hooks/useSettings";
import Header from "./components/Header";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <SettingsProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"         element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about"    element={<AboutPage />} />
          </Routes>
        </main>
        <footer style={{ background: "var(--ec-blue-dark)", color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", padding: "var(--space-4) var(--space-6)", textAlign: "center", borderTop: "3px solid var(--ec-yellow)" }}>
          <span>European Commission · AI@EC Platform · Ask LinkUP Tutorial</span>
          <span style={{ margin: "0 var(--space-3)" }}>·</span>
          <a href="https://www.linkup.so" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Linkup</a>
          <span style={{ margin: "0 var(--space-3)" }}>·</span>
          <a href="https://docs.cloud.deepset.ai" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Haystack Docs</a>
        </footer>
      </div>
    </SettingsProvider>
  );
}
