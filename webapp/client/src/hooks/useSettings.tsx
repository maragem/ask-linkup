import React, { createContext, useContext, useState } from "react";

export interface Settings {
  workspace: string;
  pipeline:  string;
}

const DEFAULTS: Settings = {
  workspace: "Test",
  pipeline:  "Tutorial_MCP_LinkUP",
};

const STORAGE_KEY = "ask-linkup:settings";

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const Ctx = createContext<SettingsCtx>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  const update = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
