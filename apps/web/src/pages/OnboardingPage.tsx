import { useState } from "react";

import { ApiError } from "../api/client";
import { usePreferences } from "../context/PreferenceContext";
import type { FontMode, ThemeMode } from "../types/models";

type OnboardingPageProps = {
  onComplete: (nextPath: string) => void;
};

const fontOptions: Array<{ value: FontMode; label: string }> = [
  { value: "TYPEWRITER", label: "Doto" },
  { value: "HANDWRITING", label: "Handwriting" },
  { value: "STANDARD", label: "Classic" },
  { value: "BOHEMIAN_TYPEWRITER", label: "Bohemian Typewriter" },
];
const themes: ThemeMode[] = ["LIGHT", "DARK"];

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { preference, updatePreference } = usePreferences();
  const [step, setStep] = useState(1);
  const [fontMode, setFontMode] = useState<FontMode>(preference.fontMode);
  const [themeMode, setThemeMode] = useState<ThemeMode>(preference.themeMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete(nextPath: string) {
    setSaving(true);
    setError(null);

    try {
      await updatePreference({
        fontMode,
        themeMode,
      });
      onComplete(nextPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save onboarding preferences.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-root">
      <section className="card onboarding-card fade-up">
        <p className="eyebrow">Welcome Flow</p>
        <h2>Let&apos;s shape your travel journal desk.</h2>

        <div className="step-dots">
          {[1, 2, 3].map((dot) => (
            <span key={dot} className={`dot ${dot <= step ? "active" : ""}`} />
          ))}
        </div>

        {step === 1 ? (
          <div className="form-grid">
            <label className="field">
              <span>Choose your writing style</span>
              <select
                value={fontMode}
                onChange={(event) => setFontMode(event.target.value as FontMode)}
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Choose your paper mood</span>
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

            <div
              className="card preview-card live-preview"
              data-theme-preview={themeMode}
              data-font-preview={fontMode}
            >
              <p className="eyebrow">Live Preview</p>
              <p className="preview-title">A platform ticket and a sunrise</p>
              <p className="preview-copy">
                The sea smelled like salt and wet stone. I walked without checking the clock.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="form-grid">
            <h3>Journal and Trips, together</h3>
            <p>
              Journal entries are the emotional memory. Trips hold practical structure like itinerary and
              expenses. You can keep entries standalone, or attach them to any trip.
            </p>
            <p className="muted">
              Start from either side and keep both in sync over time.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="form-grid">
            <h3>Choose your first action</h3>
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => {
                  void complete("/journal/new");
                }}
              >
                {saving ? "Saving..." : "Write first entry"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={saving}
                onClick={() => {
                  void complete("/trips");
                }}
              >
                {saving ? "Saving..." : "Create dream trip"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        <div className="inline-actions">
          <button type="button" className="btn" onClick={() => setStep((value) => Math.max(1, value - 1))}>
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((value) => Math.min(3, value + 1))}
            >
              Next
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
