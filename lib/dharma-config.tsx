"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { DHARMA_LOGO } from "@/lib/brand";

export type ThemeMode = "dark" | "light";

export type DharmaAppearance = {
  title: string;
  logo: string;
  associationName: string;
  menuBg: string;
  menuText: string;
  menuHoverBg: string;
  menuHoverText: string;
  darkBg: string;
  darkPrimary: string;
  darkAccent: string;
  darkAccentHover: string;
  lightBg: string;
  lightPrimary: string;
  lightAccent: string;
  lightAccentHover: string;
  bgMode: "color" | "image" | string;
  bgImage: string;
  defaultTheme: ThemeMode | string;
};

/** Defaults alinhados ao style guide Conciliadora (Marcos Lucas de Moura). */
const DEFAULTS: DharmaAppearance = {
  title: "Dharma",
  logo: DHARMA_LOGO,
  associationName: "Dharma",
  menuBg: "#171717",
  menuText: "#f1f1f1",
  menuHoverBg: "#1f1f1f",
  menuHoverText: "#f1f1f1",
  darkBg: "#0d0d0d",
  darkPrimary: "#c3d800",
  darkAccent: "#c3d800",
  darkAccentHover: "#d6ea16",
  lightBg: "#f7f7f7",
  lightPrimary: "#c3d800",
  lightAccent: "#103239",
  lightAccentHover: "#0c262b",
  bgMode: "color",
  bgImage: "",
  defaultTheme: "dark",
};

const THEME_STORAGE_KEY = "dharma-theme";

function pick(values: Record<string, unknown> | undefined, key: string, fallback: string) {
  const v = values?.[key];
  if (v == null || v === "") return fallback;
  return String(v);
}

function mergeDharmaValues(values?: Record<string, unknown>): DharmaAppearance {
  if (!values) return { ...DEFAULTS };
  return {
    title: pick(values, "VITE_DHARMA_TITLE", DEFAULTS.title),
    logo: pick(values, "VITE_DHARMA_LOGO", DEFAULTS.logo),
    associationName: DEFAULTS.associationName,
    menuBg: pick(values, "VITE_DHARMA_MENU_BG", DEFAULTS.menuBg),
    menuText: pick(values, "VITE_DHARMA_MENU_TEXT", DEFAULTS.menuText),
    menuHoverBg: pick(values, "VITE_DHARMA_MENU_HOVER_BG", DEFAULTS.menuHoverBg),
    menuHoverText: pick(
      values,
      "VITE_DHARMA_MENU_HOVER_TEXT",
      DEFAULTS.menuHoverText,
    ),
    darkBg: pick(values, "VITE_DHARMA_DARK_BG", DEFAULTS.darkBg),
    darkPrimary: pick(values, "VITE_DHARMA_DARK_PRIMARY", DEFAULTS.darkPrimary),
    darkAccent: pick(values, "VITE_DHARMA_DARK_ACCENT", DEFAULTS.darkAccent),
    darkAccentHover: pick(
      values,
      "VITE_DHARMA_DARK_ACCENT_HOVER",
      DEFAULTS.darkAccentHover,
    ),
    lightBg: pick(values, "VITE_DHARMA_LIGHT_BG", DEFAULTS.lightBg),
    lightPrimary: pick(values, "VITE_DHARMA_LIGHT_PRIMARY", DEFAULTS.lightPrimary),
    lightAccent: pick(values, "VITE_DHARMA_LIGHT_ACCENT", DEFAULTS.lightAccent),
    lightAccentHover: pick(
      values,
      "VITE_DHARMA_LIGHT_ACCENT_HOVER",
      DEFAULTS.lightAccentHover,
    ),
    bgMode: pick(values, "VITE_DHARMA_BG_MODE", DEFAULTS.bgMode),
    bgImage: pick(values, "VITE_DHARMA_BG_IMAGE", ""),
    defaultTheme: pick(values, "VITE_DHARMA_DEFAULT_THEME", DEFAULTS.defaultTheme),
  };
}

function mergeRegistration(
  base: DharmaAppearance,
  values?: Record<string, unknown>,
): DharmaAppearance {
  if (!values) return base;
  const name = pick(values, "VITE_ASSOCIATION_NAME", "").trim();
  const logoMenu = pick(values, "VITE_ASSOCIATION_LOGO_MENU", "");
  const logo = pick(values, "VITE_ASSOCIATION_LOGO", "");
  const next = { ...base };
  if (name) {
    next.associationName = name;
    next.title = name;
  }
  if (logoMenu || logo) next.logo = logoMenu || logo;
  return next;
}

function normalizeTheme(value: string | null | undefined, fallback: ThemeMode = "dark"): ThemeMode {
  return value === "light" ? "light" : value === "dark" ? "dark" : fallback;
}

function readStoredTheme(fallback: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return fallback;
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY), fallback);
  } catch {
    return fallback;
  }
}

/**
 * Aplica data-theme. Cores vêm do CSS Conciliadora; overrides de aparência
 * só afetam fundo customizado (imagem) e título, sem quebrar o design system.
 */
export function applyDharmaAppearanceVars(
  config: DharmaAppearance,
  themeMode: ThemeMode = "dark",
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isLight = themeMode === "light";
  const appBg = isLight ? config.lightBg : config.darkBg;
  const useImage = config.bgMode === "image" && Boolean(config.bgImage);

  root.dataset.theme = themeMode;
  root.style.colorScheme = themeMode;

  if (useImage) {
    document.body.style.backgroundImage = `url(${config.bgImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundColor = appBg;
  } else {
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundAttachment = "";
    document.body.style.backgroundColor = "";
  }
}

type ConfigState = {
  config: DharmaAppearance;
  configReady: boolean;
  configErrors: unknown[];
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const DharmaConfigContext = createContext<ConfigState>({
  config: DEFAULTS,
  configReady: false,
  configErrors: [],
  themeMode: "dark",
  setThemeMode: () => undefined,
  toggleTheme: () => undefined,
});

export function DharmaConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DharmaAppearance>(DEFAULTS);
  const [configReady, setConfigReady] = useState(false);
  const [configErrors, setConfigErrors] = useState<unknown[]>([]);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const fallback = normalizeTheme(DEFAULTS.defaultTheme);
    setThemeModeState(readStoredTheme(fallback));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [dharmaRes, regRes] = await Promise.allSettled([
          api.getPublicConfig("dharma"),
          api.getPublicConfig("registration"),
        ]);
        if (cancelled) return;

        let merged = { ...DEFAULTS };
        let errors: unknown[] = [];

        if (dharmaRes.status === "fulfilled") {
          const data = dharmaRes.value.data as {
            values?: Record<string, unknown>;
            errors?: unknown[];
          };
          merged = mergeDharmaValues(data?.values);
          errors = Array.isArray(data?.errors) ? data.errors : [];
        }

        if (regRes.status === "fulfilled") {
          const data = regRes.value.data as { values?: Record<string, unknown> };
          merged = mergeRegistration(merged, data?.values);
        }

        setConfig(merged);
        setConfigErrors(errors);

        const stored = readStoredTheme(
          normalizeTheme(merged.defaultTheme, "dark"),
        );
        setThemeModeState(stored);
      } finally {
        if (!cancelled) setConfigReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!configReady) {
      applyDharmaAppearanceVars(config, themeMode);
      return;
    }
    applyDharmaAppearanceVars(config, themeMode);
  }, [config, configReady, themeMode]);

  const value = useMemo(
    () => ({
      config,
      configReady,
      configErrors,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [config, configReady, configErrors, themeMode, setThemeMode, toggleTheme],
  );

  return (
    <DharmaConfigContext.Provider value={value}>{children}</DharmaConfigContext.Provider>
  );
}

export function useDharmaConfig() {
  return useContext(DharmaConfigContext);
}
