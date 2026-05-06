import React from "react";
import { Link, useLocation } from "react-router-dom";

const EUStarsSvg = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="14" cy="14" r="14" fill="#003399"/>
    {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const cx = 14 + 9 * Math.cos(angle);
      const cy = 14 + 9 * Math.sin(angle);
      return (
        <polygon key={i}
          points="0,-2.2 0.65,-0.7 2.3,-0.7 1.05,0.55 1.45,2.1 0,1.1 -1.45,2.1 -1.05,0.55 -2.3,-0.7 -0.65,-0.7"
          transform={"translate(" + cx + "," + cy + ")"} fill="#FFCC00" />
      );
    })}
  </svg>
);

export default function Header() {
  const location = useLocation();
  return (
    <header style={{ background: "var(--ec-blue)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ background: "var(--ec-blue-dark)", padding: "0 var(--space-6)", height: "var(--topbar-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <EUStarsSvg />
          <span style={{ color: "var(--white)", fontSize: "0.75rem", fontWeight: 400, letterSpacing: "0.03em" }}>European Commission</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>DIGIT.B1 – Data, Artificial Intelligence & Web</span>
      </div>
      <div style={{ padding: "0 var(--space-6)", height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", textDecoration: "none" }}>
          <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--ec-yellow)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="8" r="4" fill="none" stroke="var(--ec-blue)" strokeWidth="1.8"/>
              <path d="M5 19c0-3.31 2.69-6 6-6s6 2.69 6 6" fill="none" stroke="var(--ec-blue)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "var(--white)", fontWeight: 700, fontSize: "0.8rem", lineHeight: 1.2, letterSpacing: "0.02em", textTransform: "uppercase" }}>AI@EC Platform Tutorial</div>
            <div style={{ color: "var(--ec-yellow)", fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>Ask LinkUP</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.7rem", lineHeight: 1 }}>Real-Time Web Research Assistant</div>
          </div>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          {[{ to: "/", label: "Chat" }, { to: "/about", label: "About" }, { to: "/settings", label: "Settings" }].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color: location.pathname === to ? "var(--ec-yellow)" : "rgba(255,255,255,0.8)",
              fontSize: "0.875rem", fontWeight: location.pathname === to ? 700 : 400,
              padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              borderBottom: location.pathname === to ? "2px solid var(--ec-yellow)" : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}>{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
