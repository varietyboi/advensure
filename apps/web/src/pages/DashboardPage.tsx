import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ApiError,
  deleteJournal,
  getJournals,
  getSampleDataStatus,
  getTrips,
  removeSampleData,
  updateJournal,
} from "../api/client";
import type { JournalEntry, Mood, Trip } from "../types/models";

const moods: Mood[] = ["CALM", "HAPPY", "TIRED", "GRATEFUL", "STRESSED"];

export function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState<Mood>("CALM");
  const [editTripId, setEditTripId] = useState("");
  const [entryActionBusyId, setEntryActionBusyId] = useState<string | null>(null);

  const [hasSampleData, setHasSampleData] = useState(false);
  const [sampleBannerDismissed, setSampleBannerDismissed] = useState(false);
  const [removingSampleData, setRemovingSampleData] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [tripsResponse, journalsResponse, sampleStatus] = await Promise.all([
          getTrips(),
          getJournals(),
          getSampleDataStatus(),
        ]);

        if (!mounted) {
          return;
        }

        setTrips(tripsResponse.trips);
        setJournalEntries(journalsResponse.journalEntries);
        setHasSampleData(sampleStatus.hasSampleData);
      } catch {
        if (mounted) {
          setError("Unable to load your dashboard right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const linkedCount = useMemo(() => {
    return journalEntries.filter((entry) => Boolean(entry.tripId)).length;
  }, [journalEntries]);

  function startEditingEntry(entry: JournalEntry) {
    setError(null);
    setEditingEntryId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(entry.mood);
    setEditTripId(entry.tripId ?? "");
  }

  function cancelEditingEntry() {
    setEditingEntryId(null);
    setEditTitle("");
    setEditContent("");
    setEditMood("CALM");
    setEditTripId("");
  }

  async function handleSaveEntry(entryId: string) {
    setError(null);
    setEntryActionBusyId(entryId);

    try {
      await updateJournal(entryId, {
        title: editTitle,
        content: editContent,
        mood: editMood,
        tripId: editTripId || null,
      });

      const selectedTrip = editTripId ? trips.find((trip) => trip.id === editTripId) ?? null : null;

      setJournalEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                title: editTitle,
                content: editContent,
                mood: editMood,
                tripId: editTripId || null,
                trip: selectedTrip
                  ? {
                      id: selectedTrip.id,
                      location: selectedTrip.location,
                    }
                  : null,
              }
            : entry
        )
      );

      cancelEditingEntry();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to update this journal entry.");
      }
    } finally {
      setEntryActionBusyId(null);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    const confirmed = window.confirm("Delete this journal entry?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setEntryActionBusyId(entryId);

    try {
      await deleteJournal(entryId);
      setJournalEntries((current) => current.filter((entry) => entry.id !== entryId));

      if (editingEntryId === entryId) {
        cancelEditingEntry();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to delete this journal entry.");
      }
    } finally {
      setEntryActionBusyId(null);
    }
  }

  async function handleRemoveSampleData() {
    setError(null);
    setRemovingSampleData(true);

    try {
      await removeSampleData();
      const [tripsResponse, journalsResponse] = await Promise.all([getTrips(), getJournals()]);
      setTrips(tripsResponse.trips);
      setJournalEntries(journalsResponse.journalEntries);
      setHasSampleData(false);
      setSampleBannerDismissed(true);
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

  if (loading) {
    return (
      <section className="card fade-up">
        <h2>Loading your workspace...</h2>
      </section>
    );
  }

  return (
    <div className="page-grid">
      {hasSampleData && !sampleBannerDismissed ? (
        <section className="card fade-up sample-banner">
          <button
            type="button"
            className="banner-close"
            aria-label="Close sample data notice"
            onClick={() => setSampleBannerDismissed(true)}
          >
            X
          </button>
          <p>
            We have added some sample data for your reference. You can remove this in the settings,
            or by clicking here -&gt;
          </p>
          <div className="item-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={removingSampleData}
              onClick={() => void handleRemoveSampleData()}
            >
              {removingSampleData ? "Removing..." : "Remove sample data"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="card hero-card fade-up card-stack">
        <p className="eyebrow">Today&apos;s Desk</p>
        <h2>Welcome back to your paper trail.</h2>
        <p className="muted">
          Capture moments while they are warm, then keep the practical details close at hand.
        </p>

        <div className="stat-grid">
          <article className="stat-card">
            <strong>{trips.length}</strong>
            <span>Total trips</span>
          </article>
          <article className="stat-card">
            <strong>{journalEntries.length}</strong>
            <span>Journal entries</span>
          </article>
          <article className="stat-card">
            <strong>{linkedCount}</strong>
            <span>Entries linked to trips</span>
          </article>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="card fade-up card-stack">
        <div className="section-header">
          <h3>Recent Trips</h3>
          <Link to="/trips" className="text-link">
            Open trips
          </Link>
        </div>

        {trips.length === 0 ? (
          <p className="muted">No trips yet. Start with your first dream destination.</p>
        ) : (
          <ul className="list-stack">
            {trips.slice(0, 4).map((trip) => (
              <li key={trip.id} className="list-item">
                <div>
                  <strong>{trip.location}</strong>
                  <p className="muted trip-dates">
                    {new Date(trip.startDate).toLocaleDateString()} -{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Link to={`/trips/${trip.id}`} className="btn btn-soft">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card fade-up card-stack">
        <div className="section-header">
          <h3>Reflections</h3>
          <Link to="/journal/new" className="text-link">
            New entry
          </Link>
        </div>

        {journalEntries.length === 0 ? (
          <p className="muted">No entries yet. Start with one moment from today.</p>
        ) : (
          <ul className="list-stack">
            {journalEntries.map((entry) => (
              <li key={entry.id} className="journal-item">
                {editingEntryId === entry.id ? (
                  <div className="form-grid inline-editor">
                    <label className="field">
                      <span>Title</span>
                      <input
                        value={editTitle}
                        minLength={2}
                        maxLength={180}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                    </label>

                    <div className="two-col-grid">
                      <label className="field">
                        <span>Mood</span>
                        <select value={editMood} onChange={(event) => setEditMood(event.target.value as Mood)}>
                          {moods.map((mood) => (
                            <option key={mood} value={mood}>
                              {mood}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Linked trip</span>
                        <select value={editTripId} onChange={(event) => setEditTripId(event.target.value)}>
                          <option value="">Standalone entry</option>
                          {trips.map((trip) => (
                            <option key={trip.id} value={trip.id}>
                              {trip.location}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="field">
                      <span>Entry</span>
                      <textarea
                        rows={6}
                        minLength={1}
                        maxLength={50000}
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                      />
                    </label>

                    <div className="item-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={entryActionBusyId === entry.id}
                        onClick={() => void handleSaveEntry(entry.id)}
                      >
                        {entryActionBusyId === entry.id ? "Saving..." : "Save"}
                      </button>
                      <button className="btn" type="button" onClick={cancelEditingEntry}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="journal-item-head">
                      <strong className="journal-title">{entry.title}</strong>
                      <span className="pill">{entry.mood.toLowerCase()}</span>
                    </div>
                    {entry.trip ? (
                      <p className="entry-context">in {entry.trip.location}</p>
                    ) : null}
                    <p>{entry.content.slice(0, 140)}{entry.content.length > 140 ? "..." : ""}</p>
                    <div className="item-actions">
                      <button className="btn" type="button" onClick={() => startEditingEntry(entry)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        disabled={entryActionBusyId === entry.id}
                        onClick={() => void handleDeleteEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
