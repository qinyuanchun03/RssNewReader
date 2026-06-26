import React, { createContext, useContext, useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";
export type ReadingWidth = "narrow" | "normal" | "wide" | "full";
export type AiProvider = "gemini" | "openai" | "anthropic" | "openrouter" | "zenmux" | "custom";

interface Settings {
  theme: Theme;
  primaryColor: string;
  fontSize: number;
  lineHeight: number;
  readingWidth: ReadingWidth;
  fontFamily: string;
  enableAi: boolean;
  aiProvider: AiProvider;
  geminiApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicBaseUrl: string;
  anthropicModel: string;
  openrouterApiKey: string;
  openrouterBaseUrl: string;
  openrouterModel: string;
  zenmuxApiKey: string;
  zenmuxBaseUrl: string;
  zenmuxModel: string;
  customApiKey: string;
  customBaseUrl: string;
  customModel: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: "system",
  primaryColor: "#3b82f6", // Default Blue
  fontSize: 16,
  lineHeight: 1.6,
  readingWidth: "normal",
  fontFamily: "Inter, sans-serif",
  enableAi: false,
  aiProvider: "gemini",
  geminiApiKey: "",
  openaiApiKey: "",
  openaiBaseUrl: "https://api.openai.com/v1",
  openaiModel: "gpt-4o-mini",
  anthropicApiKey: "",
  anthropicBaseUrl: "https://api.anthropic.com",
  anthropicModel: "claude-3-5-sonnet-latest",
  openrouterApiKey: "",
  openrouterBaseUrl: "https://openrouter.ai/api/v1",
  openrouterModel: "google/gemini-2.5-flash",
  zenmuxApiKey: "",
  zenmuxBaseUrl: "https://zenmux.ai/api/v1",
  zenmuxModel: "deepseek-chat",
  customApiKey: "",
  customBaseUrl: "https://api.openai.com/v1",
  customModel: "gpt-4o-mini",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("n_reader_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.zenmuxBaseUrl === "https://api.zenmux.ai/v1") {
          parsed.zenmuxBaseUrl = "https://zenmux.ai/api/v1";
        }
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("n_reader_settings", JSON.stringify(settings));
    
    // Apply theme
    const root = window.document.documentElement;
    const isDark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply primary color
    root.style.setProperty("--primary", settings.primaryColor);
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
