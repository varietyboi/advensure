import { FormEvent, useEffect, useState } from "react";

import { ApiError, createJournal, getTrips } from "../api/client";
import type { Mood, TemplateKind, Trip } from "../types/models";

const moods: Mood[] = ["CALM", "HAPPY", "TIRED", "GRATEFUL", "STRESSED", "ANXIOUS"];
const templates: TemplateKind[] = ["BLANK", "STANDARD"];

export function NewJournalPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood>("CALM");
  const [template, setTemplate] = useState<TemplateKind>("BLANK");
  const [tripId, setTripId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingTrips(true);

      try {
        const response = await getTrips();

        if (mounted) {
          setTrips(response.trips);
        }
      } catch {
        if (mounted) {
          setError("Could not load trips for linking.");
        }
      } finally {
        if (mounted) {
          setLoadingTrips(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await createJournal({
        title,
        content,
        mood,
        template,
        ...(tripId ? { tripId } : {}),
      });

      setTitle("");
      setContent("");
      setMood("CALM");
      setTemplate("BLANK");
      setTripId("");
      setSuccess("Entry saved.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save this entry.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="card fade-up card-stack">
        <p className="eyebrow">The Heart</p>
        <h2>New Journal Entry</h2>
        <p className="muted">Write freely, then connect your story to a trip if you want.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Title</span>
            <input
              required
              minLength={2}
              maxLength={180}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A rainy evening in Lisbon"
            />
          </label>

          <label className="field">
            <span>How are you feeling?</span>
            <select value={mood} onChange={(event) => setMood(event.target.value as Mood)}>
              {moods.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Template</span>
            <select
              value={template}
              onChange={(event) => setTemplate(event.target.value as TemplateKind)}
            >
              {templates.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Link to trip (optional)</span>
            <select value={tripId} onChange={(event) => setTripId(event.target.value)}>
              <option value="">Standalone entry</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.location}
                </option>
              ))}
            </select>
            {loadingTrips ? <small className="muted">Loading trips...</small> : null}
          </label>

          <label className="field">
            <span>Entry</span>
            <textarea
              required
              minLength={1}
              maxLength={50000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={12}
              placeholder="What did today feel like?"
            />
          </label>

          <p className="muted">Media upload UI will be wired in next slice.</p>

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </form>
      </section>
    </div>
  );
}
