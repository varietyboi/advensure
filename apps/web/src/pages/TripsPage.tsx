import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError, createTrip, deleteTrip, getTrips, updateTrip } from "../api/client";
import type { Trip } from "../types/models";

function toDateInputValue(dateIso: string) {
  const date = new Date(dateIso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [tripActionBusyId, setTripActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      try {
        const response = await getTrips();

        if (mounted) {
          setTrips(response.trips);
        }
      } catch {
        if (mounted) {
          setError("Unable to load trips.");
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

  async function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await createTrip({
        location,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        ...(budget ? { budget: Number(budget) } : {}),
      });

      setTrips((current) => [response.trip, ...current]);
      setLocation("");
      setBudget("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create trip.");
      }
    } finally {
      setSaving(false);
    }
  }

  function startEditingTrip(trip: Trip) {
    setError(null);
    setEditingTripId(trip.id);
    setEditLocation(trip.location);
    setEditBudget(trip.budget ?? "");
    setEditStartDate(toDateInputValue(trip.startDate));
    setEditEndDate(toDateInputValue(trip.endDate));
  }

  function cancelEditingTrip() {
    setEditingTripId(null);
    setEditLocation("");
    setEditBudget("");
    setEditStartDate("");
    setEditEndDate("");
  }

  async function handleUpdateTrip(event: FormEvent<HTMLFormElement>, tripId: string) {
    event.preventDefault();
    setError(null);
    setTripActionBusyId(tripId);

    try {
      const response = await updateTrip(tripId, {
        location: editLocation,
        budget: editBudget ? Number(editBudget) : null,
        startDate: new Date(editStartDate).toISOString(),
        endDate: new Date(editEndDate).toISOString(),
      });

      setTrips((current) =>
        current.map((trip) => (trip.id === response.trip.id ? response.trip : trip))
      );
      cancelEditingTrip();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update trip.");
      }
    } finally {
      setTripActionBusyId(null);
    }
  }

  async function handleDeleteTrip(tripId: string) {
    const confirmed = window.confirm("Delete this trip and its linked itinerary, expenses, and journal links?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setTripActionBusyId(tripId);

    try {
      await deleteTrip(tripId);
      setTrips((current) => current.filter((trip) => trip.id !== tripId));

      if (editingTripId === tripId) {
        cancelEditingTrip();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to delete trip.");
      }
    } finally {
      setTripActionBusyId(null);
    }
  }

  return (
    <div className="page-grid">
      <section className="card fade-up card-stack">
        <h2>Trips</h2>
        <p className="muted">Create a destination, then connect your journal entries to it.</p>

        <form className="form-grid" onSubmit={handleCreateTrip}>
          <label className="field">
            <span>Location</span>
            <input
              value={location}
              required
              minLength={2}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Kyoto, Japan"
            />
          </label>

          <label className="field">
            <span>Budget (optional)</span>
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              type="number"
              step="0.01"
              min="0"
              placeholder="1200"
            />
          </label>

          <div className="two-col-grid">
            <label className="field">
              <span>Start date</span>
              <input
                required
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label className="field">
              <span>End date</span>
              <input
                required
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create Trip"}
          </button>
        </form>
      </section>

      <section className="card fade-up card-stack">
        <div className="section-header">
          <h3>Your destinations</h3>
          <span className="pill">{trips.length} total</span>
        </div>

        {loading ? <p>Loading trips...</p> : null}

        {!loading && trips.length === 0 ? (
          <p className="muted">No trips yet. Start with a place you want to remember.</p>
        ) : null}

        <ul className="list-stack">
          {trips.map((trip) => (
            <li key={trip.id} className="list-item list-item-left">
              {editingTripId === trip.id ? (
                <form className="form-grid inline-editor" onSubmit={(event) => void handleUpdateTrip(event, trip.id)}>
                  <label className="field">
                    <span>Location</span>
                    <input
                      value={editLocation}
                      required
                      minLength={2}
                      onChange={(event) => setEditLocation(event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Budget (optional)</span>
                    <input
                      value={editBudget}
                      onChange={(event) => setEditBudget(event.target.value)}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Leave empty to clear"
                    />
                  </label>

                  <div className="two-col-grid">
                    <label className="field">
                      <span>Start date</span>
                      <input
                        required
                        type="date"
                        value={editStartDate}
                        onChange={(event) => setEditStartDate(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>End date</span>
                      <input
                        required
                        type="date"
                        value={editEndDate}
                        onChange={(event) => setEditEndDate(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="item-actions">
                    <button className="btn btn-primary" type="submit" disabled={tripActionBusyId === trip.id}>
                      {tripActionBusyId === trip.id ? "Saving..." : "Save"}
                    </button>
                    <button className="btn" type="button" onClick={cancelEditingTrip}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      disabled={tripActionBusyId === trip.id}
                      onClick={() => void handleDeleteTrip(trip.id)}
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="list-item-body">
                    <strong>{trip.location}</strong>
                    <p className="muted trip-dates">
                      {new Date(trip.startDate).toLocaleDateString()} -{" "}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="item-actions">
                    <Link className="btn btn-soft" to={`/trips/${trip.id}`}>
                      Open
                    </Link>
                    <button className="btn" type="button" onClick={() => startEditingTrip(trip)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      type="button"
                      disabled={tripActionBusyId === trip.id}
                      onClick={() => void handleDeleteTrip(trip.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
