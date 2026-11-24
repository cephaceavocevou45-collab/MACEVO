import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import settingsService from "../services/settingsService";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

function applyThemeToDocument(theme) {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;

  let resolvedTheme = theme;

  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    resolvedTheme = prefersDark ? "dark" : "light";
  }

  root.classList.toggle(
    "dark",
    resolvedTheme === "dark"
  );

  root.setAttribute("data-theme", resolvedTheme);

  localStorage.setItem("macevo-theme", theme);
}

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const applyTheme = useCallback((theme) => {
    applyThemeToDocument(theme);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await settingsService.getSettings();

      setSettings(data);

      if (data?.theme) {
        applyThemeToDocument(data.theme);
      }
    } catch (err) {
      console.error(
        "Erreur chargement paramètres :",
        err
      );

      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (data) => {
    try {
      setSaving(true);
      setError(null);

      const updated =
        await settingsService.updateSettings(data);

      setSettings(updated);

      if (data?.theme || updated?.theme) {
        applyThemeToDocument(
          data?.theme ?? updated.theme
        );
      }

      return updated;
    } catch (err) {
      console.error(
        "Erreur mise à jour paramètres :",
        err
      );

      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSettings(null);
      setError(null);
      setLoading(false);
      return;
    }

    loadSettings();
  }, [isAuthenticated, loadSettings]);

  useEffect(() => {
    if (!settings?.theme) {
      return undefined;
    }

    applyThemeToDocument(settings.theme);

    if (settings.theme !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemTheme = () => {
      applyThemeToDocument("system");
    };

    mediaQuery.addEventListener?.(
      "change",
      handleSystemTheme
    );

    return () => {
      mediaQuery.removeEventListener?.(
        "change",
        handleSystemTheme
      );
    };
  }, [settings?.theme]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      saving,
      error,
      loadSettings,
      updateSettings,
      applyTheme,
    }),
    [
      settings,
      loading,
      saving,
      error,
      loadSettings,
      updateSettings,
      applyTheme,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettingsContext doit être utilisé dans SettingsProvider"
    );
  }

  return context;
}