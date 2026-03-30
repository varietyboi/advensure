import { useEffect, useState } from "react";

import { ApiError, deleteAccount, getSampleDataStatus, removeSampleData } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferenceContext";
import type { FontMode, ThemeMode } from "../types/models";

type SettingsPageProps = {
  onResetOnboarding: () => void;
};

const fontOptions: Array<{ value: FontMode; label: string }> = [
  { value: "STANDARD", label: "Classic" },
  { value: "TYPEWRITER", label: "Doto" },
  { value: "HANDWRITING", label: "Handwriting" },
  { value: "BOHEMIAN_TYPEWRITER", label: "Bohemian Typewriter" },
];
const themes: ThemeMode[] = ["LIGHT", "DARK"];

export function SettingsPage({ onResetOnboarding }: SettingsPageProps) {
  const { logout } = useAuth();
  const { preference, updatePreference } = usePreferences();
  const [fontMode, setFontMode] = useState<FontMode>(preference.fontMode);
  const [themeMode, setThemeMode] = useState<ThemeMode>(preference.themeMode);
  const [saving, setSaving] = useState(false);
  const [loadingSampleStatus, setLoadingSampleStatus] = useState(true);
  const [removingSampleData, setRemovingSampleData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [hasSampleData, setHasSampleData] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFontMode(preference.fontMode);
    setThemeMode(preference.themeMode);
  }, [preference]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingSampleStatus(true);

      try {
        const response = await getSampleDataStatus();

        if (mounted) {
          setHasSampleData(response.hasSampleData);
        }
      } catch {
        if (mounted) {
          setHasSampleData(false);
        }
      } finally {
        if (mounted) {
          setLoadingSampleStatus(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updatePreference({
        fontMode,
        themeMode,
      });

      setMessage("Preferences saved.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save preferences.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSampleData() {
    const confirmed = window.confirm("Remove all sample trips and sample journal entries from this account?");

    if (!confirmed) {
      return;
    }

    setRemovingSampleData(true);
    setError(null);
    setMessage(null);

    try {
      await removeSampleData();
      setHasSampleData(false);
      setMessage("Sample data removed.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to remove sample data.");
      }
    } finally {
      setRemovingSampleData(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your login and all trips, journals, itinerary items, expenses, and preferences."
    );

    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setError(null);
    setMessage(null);

    try {
      await deleteAccount();
      logout();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to delete account right now.");
      }
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="card fade-up card-stack">
        <h2>Settings</h2>
        <p className="muted">Tune the writing atmosphere to match your travel mood.</p>

        <div className="form-grid">
          <label className="field">
            <span>Font style</span>
            <select value={fontMode} onChange={(event) => setFontMode(event.target.value as FontMode)}>
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Theme</span>
            <select
              value={themeMode}
              onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
            >
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-actions">
            <button className="btn btn-primary" type="button" disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save preferences"}
            </button>

            <button className="btn" type="button" onClick={onResetOnboarding}>
              Replay onboarding
            </button>

            <button
              className="btn btn-danger"
              type="button"
              disabled={loadingSampleStatus || removingSampleData || deletingAccount || !hasSampleData}
              onClick={() => void handleRemoveSampleData()}
            >
              {removingSampleData ? "Removing..." : "Remove sample data"}
            </button>

            <button
              className="btn btn-danger"
              type="button"
              disabled={saving || removingSampleData || deletingAccount}
              onClick={() => void handleDeleteAccount()}
            >
              {deletingAccount ? "Deleting account..." : "Delete account"}
            </button>
          </div>

          <p className="muted compact-note">
            {loadingSampleStatus
              ? "Checking sample data status..."
              : hasSampleData
                ? "Sample data is currently present in your account."
                : "No sample data found in your account."}
          </p>

          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
