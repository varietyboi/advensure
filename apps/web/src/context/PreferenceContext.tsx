import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getPreferences, savePreferences } from "../api/client";
import { useAuth } from "./AuthContext";
import type { FontMode, ThemeMode, ThemePreference } from "../types/models";

type PreferenceContextValue = {
  preference: ThemePreference;
  loading: boolean;
  updatePreference: (updates: { fontMode?: FontMode; themeMode?: ThemeMode }) => Promise<void>;
  refreshPreference: () => Promise<void>;
};

const defaultPreference: ThemePreference = {
  fontMode: "STANDARD",
  themeMode: "LIGHT",
};

const PreferenceContext = createContext<PreferenceContextValue | undefined>(undefined);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preference, setPreference] = useState<ThemePreference>(defaultPreference);
  const [loading, setLoading] = useState(true);

  const applyToDocument = useCallback((next: ThemePreference) => {
    document.documentElement.setAttribute("data-theme", next.themeMode);
    document.documentElement.setAttribute("data-font", next.fontMode);
  }, []);

  const refreshPreference = useCallback(async () => {
    if (!user) {
      setPreference(defaultPreference);
      applyToDocument(defaultPreference);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await getPreferences();
      setPreference(response.preference);
      applyToDocument(response.preference);
    } catch {
      setPreference(defaultPreference);
      applyToDocument(defaultPreference);
    } finally {
      setLoading(false);
    }
  }, [user, applyToDocument]);

  useEffect(() => {
    void refreshPreference();
  }, [refreshPreference]);

  const updatePreference = useCallback(
    async (updates: { fontMode?: FontMode; themeMode?: ThemeMode }) => {
      const response = await savePreferences(updates);
      setPreference(response.preference);
      applyToDocument(response.preference);
    },
    [applyToDocument]
  );

  const value = useMemo<PreferenceContextValue>(
    () => ({
      preference,
      loading,
      updatePreference,
      refreshPreference,
    }),
    [preference, loading, updatePreference, refreshPreference]
  );

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferenceContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferenceProvider");
  }

  return context;
}
