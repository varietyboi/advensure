import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ApiError,
  addExpense,
  addItineraryItem,
  deleteExpense,
  deleteItineraryItem,
  deleteJournal,
  deleteTrip,
  getTrip,
  updateExpense,
  updateItineraryItem,
  updateJournal,
  updateTrip,
} from "../api/client";
import { majorCurrencies } from "../constants/currencies";
import type { CurrencyCode, Mood, TripDetail } from "../types/models";

const moods: Mood[] = ["CALM", "HAPPY", "TIRED", "GRATEFUL", "STRESSED"];

function toDateInputValue(dateIso: string) {
  const date = new Date(dateIso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toDateTimeInputValue(dateIso: string | null) {
  if (!dateIso) {
    return "";
  }

  const date = new Date(dateIso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatMoney(amount: number, currency: CurrencyCode | null) {
  if (!currency) {
    return amount.toFixed(2);
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function TripDetailPage() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTrip, setEditingTrip] = useState(false);
  const [tripLocation, setTripLocation] = useState("");
  const [tripBudget, setTripBudget] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [tripBusy, setTripBusy] = useState(false);

  const [itineraryTitle, setItineraryTitle] = useState("");
  const [itineraryStartsAt, setItineraryStartsAt] = useState("");
  const [itineraryNotes, setItineraryNotes] = useState("");
  const [itineraryBusy, setItineraryBusy] = useState(false);

  const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);
  const [editItineraryTitle, setEditItineraryTitle] = useState("");
  const [editItineraryStartsAt, setEditItineraryStartsAt] = useState("");
  const [editItineraryNotes, setEditItineraryNotes] = useState("");
  const [itineraryActionBusyId, setItineraryActionBusyId] = useState<string | null>(null);

  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState<CurrencyCode>("USD");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseBusy, setExpenseBusy] = useState(false);

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseLabel, setEditExpenseLabel] = useState("");
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [editExpenseCurrency, setEditExpenseCurrency] = useState<CurrencyCode>("USD");
  const [editExpenseDate, setEditExpenseDate] = useState("");
  const [expenseActionBusyId, setExpenseActionBusyId] = useState<string | null>(null);

  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [editJournalTitle, setEditJournalTitle] = useState("");
  const [editJournalContent, setEditJournalContent] = useState("");
  const [editJournalMood, setEditJournalMood] = useState<Mood>("CALM");
  const [journalActionBusyId, setJournalActionBusyId] = useState<string | null>(null);

  async function refreshTrip() {
    if (!tripId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTrip(tripId);
      setTrip(response.trip);
    } catch {
      setError("Unable to load this trip.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const spentTotal = useMemo(() => {
    if (!trip) {
      return 0;
    }

    return trip.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }, [trip]);

  const budgetTotal = useMemo(() => {
    return trip?.budget ? Number(trip.budget) : 0;
  }, [trip]);

  const budgetRatio = useMemo(() => {
    if (!budgetTotal) {
      return 0;
    }

    return Math.min(100, Math.round((spentTotal / budgetTotal) * 100));
  }, [spentTotal, budgetTotal]);

  const remainingBudget = useMemo(() => {
    if (!budgetTotal) {
      return 0;
    }

    return budgetTotal - spentTotal;
  }, [budgetTotal, spentTotal]);

  const budgetCurrency = useMemo<CurrencyCode | null>(() => {
    if (!trip || trip.expenses.length === 0) {
      return null;
    }

    const uniqueCurrencies = Array.from(new Set(trip.expenses.map((expense) => expense.currency)));
    return uniqueCurrencies.length === 1 ? uniqueCurrencies[0] : null;
  }, [trip]);

  const hasMixedExpenseCurrencies = useMemo(() => {
    if (!trip || trip.expenses.length === 0) {
      return false;
    }

    return new Set(trip.expenses.map((expense) => expense.currency)).size > 1;
  }, [trip]);

  function startEditingTrip() {
    if (!trip) {
      return;
    }

    setEditingTrip(true);
    setTripLocation(trip.location);
    setTripBudget(trip.budget ?? "");
    setTripStartDate(toDateInputValue(trip.startDate));
    setTripEndDate(toDateInputValue(trip.endDate));
  }

  function cancelEditingTrip() {
    setEditingTrip(false);
    setTripLocation("");
    setTripBudget("");
    setTripStartDate("");
    setTripEndDate("");
  }

  async function handleUpdateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tripId) {
      return;
    }

    setTripBusy(true);
    setError(null);

    try {
      await updateTrip(tripId, {
        location: tripLocation,
        budget: tripBudget ? Number(tripBudget) : null,
        startDate: new Date(tripStartDate).toISOString(),
        endDate: new Date(tripEndDate).toISOString(),
      });

      cancelEditingTrip();
      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update trip.");
    } finally {
      setTripBusy(false);
    }
  }

  async function handleDeleteTrip() {
    if (!tripId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this trip and everything linked to it (itinerary, expenses, and trip links from journals)?"
    );

    if (!confirmed) {
      return;
    }

    setTripBusy(true);
    setError(null);

    try {
      await deleteTrip(tripId);
      navigate("/trips", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete trip.");
    } finally {
      setTripBusy(false);
    }
  }

  async function handleAddItinerary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tripId) {
      return;
    }

    setItineraryBusy(true);
    setError(null);

    try {
      await addItineraryItem(tripId, {
        title: itineraryTitle,
        ...(itineraryStartsAt ? { startsAt: new Date(itineraryStartsAt).toISOString() } : {}),
        ...(itineraryNotes ? { notes: itineraryNotes } : {}),
      });

      setItineraryTitle("");
      setItineraryStartsAt("");
      setItineraryNotes("");
      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to add itinerary item.");
    } finally {
      setItineraryBusy(false);
    }
  }

  function startEditingItinerary(item: TripDetail["itineraryItems"][number]) {
    setEditingItineraryId(item.id);
    setEditItineraryTitle(item.title);
    setEditItineraryStartsAt(toDateTimeInputValue(item.startsAt));
    setEditItineraryNotes(item.notes ?? "");
  }

  function cancelEditingItinerary() {
    setEditingItineraryId(null);
    setEditItineraryTitle("");
    setEditItineraryStartsAt("");
    setEditItineraryNotes("");
  }

  async function handleUpdateItinerary(itemId: string) {
    if (!tripId) {
      return;
    }

    setError(null);
    setItineraryActionBusyId(itemId);

    try {
      await updateItineraryItem(tripId, itemId, {
        title: editItineraryTitle,
        notes: editItineraryNotes || null,
        startsAt: editItineraryStartsAt ? new Date(editItineraryStartsAt).toISOString() : null,
      });

      cancelEditingItinerary();
      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update itinerary item.");
    } finally {
      setItineraryActionBusyId(null);
    }
  }

  async function handleDeleteItinerary(itemId: string) {
    if (!tripId) {
      return;
    }

    const confirmed = window.confirm("Delete this itinerary item?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setItineraryActionBusyId(itemId);

    try {
      await deleteItineraryItem(tripId, itemId);

      if (editingItineraryId === itemId) {
        cancelEditingItinerary();
      }

      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete itinerary item.");
    } finally {
      setItineraryActionBusyId(null);
    }
  }

  async function handleAddExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tripId) {
      return;
    }

    setExpenseBusy(true);
    setError(null);

    try {
      await addExpense(tripId, {
        label: expenseLabel,
        amount: Number(expenseAmount),
        currency: expenseCurrency,
        ...(expenseDate ? { spentOn: new Date(expenseDate).toISOString() } : {}),
      });

      setExpenseLabel("");
      setExpenseAmount("");
      setExpenseCurrency("USD");
      setExpenseDate("");
      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to add expense.");
    } finally {
      setExpenseBusy(false);
    }
  }

  function startEditingExpense(expense: TripDetail["expenses"][number]) {
    setEditingExpenseId(expense.id);
    setEditExpenseLabel(expense.label);
    setEditExpenseAmount(expense.amount);
    setEditExpenseCurrency(expense.currency);
    setEditExpenseDate(toDateInputValue(expense.spentOn));
  }

  function cancelEditingExpense() {
    setEditingExpenseId(null);
    setEditExpenseLabel("");
    setEditExpenseAmount("");
    setEditExpenseCurrency("USD");
    setEditExpenseDate("");
  }

  async function handleUpdateExpense(expenseId: string) {
    if (!tripId) {
      return;
    }

    setError(null);
    setExpenseActionBusyId(expenseId);

    try {
      await updateExpense(tripId, expenseId, {
        label: editExpenseLabel,
        amount: Number(editExpenseAmount),
        currency: editExpenseCurrency,
        spentOn: editExpenseDate ? new Date(editExpenseDate).toISOString() : null,
      });

      cancelEditingExpense();
      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update expense.");
    } finally {
      setExpenseActionBusyId(null);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!tripId) {
      return;
    }

    const confirmed = window.confirm("Delete this expense?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setExpenseActionBusyId(expenseId);

    try {
      await deleteExpense(tripId, expenseId);

      if (editingExpenseId === expenseId) {
        cancelEditingExpense();
      }

      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete expense.");
    } finally {
      setExpenseActionBusyId(null);
    }
  }

  function startEditingJournal(entry: TripDetail["journalEntries"][number]) {
    setEditingJournalId(entry.id);
    setEditJournalTitle(entry.title);
    setEditJournalContent(entry.content);
    setEditJournalMood(entry.mood);
  }

  function cancelEditingJournal() {
    setEditingJournalId(null);
    setEditJournalTitle("");
    setEditJournalContent("");
    setEditJournalMood("CALM");
  }

  async function handleUpdateJournal(entryId: string) {
    setError(null);
    setJournalActionBusyId(entryId);

    try {
      await updateJournal(entryId, {
        title: editJournalTitle,
        content: editJournalContent,
        mood: editJournalMood,
      });

      cancelEditingJournal();
      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update linked journal.");
    } finally {
      setJournalActionBusyId(null);
    }
  }

  async function handleDeleteJournal(entryId: string) {
    const confirmed = window.confirm("Delete this linked journal entry?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setJournalActionBusyId(entryId);

    try {
      await deleteJournal(entryId);

      if (editingJournalId === entryId) {
        cancelEditingJournal();
      }

      await refreshTrip();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete linked journal.");
    } finally {
      setJournalActionBusyId(null);
    }
  }

  if (!tripId) {
    return (
      <section className="card fade-up">
        <p className="error-text">Missing trip identifier.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="card fade-up">
        <h2>Loading trip workspace...</h2>
      </section>
    );
  }

  if (!trip) {
    return (
      <section className="card fade-up">
        <p className="error-text">Trip not found.</p>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="card fade-up card-stack">
        <p className="eyebrow">Trip Dashboard</p>

        {editingTrip ? (
          <form className="form-grid" onSubmit={(event) => void handleUpdateTrip(event)}>
            <label className="field">
              <span>Location</span>
              <input
                required
                minLength={2}
                value={tripLocation}
                onChange={(event) => setTripLocation(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Budget (optional)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tripBudget}
                onChange={(event) => setTripBudget(event.target.value)}
                placeholder="Leave empty to clear"
              />
            </label>

            <div className="two-col-grid">
              <label className="field">
                <span>Start date</span>
                <input
                  type="date"
                  required
                  value={tripStartDate}
                  onChange={(event) => setTripStartDate(event.target.value)}
                />
              </label>
              <label className="field">
                <span>End date</span>
                <input
                  type="date"
                  required
                  value={tripEndDate}
                  onChange={(event) => setTripEndDate(event.target.value)}
                />
              </label>
            </div>

            <div className="item-actions">
              <button className="btn btn-primary" type="submit" disabled={tripBusy}>
                {tripBusy ? "Saving..." : "Save trip"}
              </button>
              <button className="btn" type="button" onClick={cancelEditingTrip}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2>{trip.location}</h2>
            <p className="muted trip-dates">
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </p>
            <div className="item-actions">
              <button className="btn" type="button" onClick={startEditingTrip}>
                Edit trip
              </button>
              <button className="btn btn-danger" type="button" disabled={tripBusy} onClick={() => void handleDeleteTrip()}>
                Delete trip
              </button>
            </div>
          </>
        )}

        {budgetTotal > 0 ? (
          <div className="budget-meter-wrap">
            <div className="budget-meta">
              <span>Spent: {formatMoney(spentTotal, budgetCurrency)}</span>
              <span>Budget: {formatMoney(budgetTotal, budgetCurrency)}</span>
              <span>Remaining: {formatMoney(remainingBudget, budgetCurrency)}</span>
            </div>
            <div className="budget-meter">
              <div
                className={`budget-fill ${budgetRatio >= 90 ? "budget-alert" : ""}`}
                style={{ width: `${budgetRatio}%` }}
              />
            </div>
            {hasMixedExpenseCurrencies ? (
              <p className="muted compact-note">
                Mixed expense currencies detected. Budget totals are approximate.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="muted">No budget set yet.</p>
        )}

        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="card fade-up card-stack">
        <h3>Itinerary</h3>
        <form className="form-grid" onSubmit={handleAddItinerary}>
          <label className="field">
            <span>Title</span>
            <input
              required
              minLength={2}
              value={itineraryTitle}
              onChange={(event) => setItineraryTitle(event.target.value)}
              placeholder="Sunrise walk at Fushimi Inari"
            />
          </label>

          <div className="two-col-grid">
            <label className="field">
              <span>Time (optional)</span>
              <input
                type="datetime-local"
                value={itineraryStartsAt}
                onChange={(event) => setItineraryStartsAt(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Notes (optional)</span>
              <input
                value={itineraryNotes}
                onChange={(event) => setItineraryNotes(event.target.value)}
                placeholder="Bring water"
              />
            </label>
          </div>

          <button className="btn btn-primary" type="submit" disabled={itineraryBusy}>
            {itineraryBusy ? "Adding..." : "Add itinerary item"}
          </button>
        </form>

        <ul className="list-stack">
          {trip.itineraryItems.length === 0 ? (
            <li className="muted">No itinerary items yet.</li>
          ) : (
            trip.itineraryItems.map((item) => (
              <li key={item.id} className="list-item list-item-left">
                {editingItineraryId === item.id ? (
                  <div className="form-grid inline-editor">
                    <label className="field">
                      <span>Title</span>
                      <input
                        value={editItineraryTitle}
                        minLength={2}
                        onChange={(event) => setEditItineraryTitle(event.target.value)}
                      />
                    </label>

                    <div className="two-col-grid">
                      <label className="field">
                        <span>Time (optional)</span>
                        <input
                          type="datetime-local"
                          value={editItineraryStartsAt}
                          onChange={(event) => setEditItineraryStartsAt(event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Notes (optional)</span>
                        <input
                          value={editItineraryNotes}
                          onChange={(event) => setEditItineraryNotes(event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="item-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={itineraryActionBusyId === item.id}
                        onClick={() => void handleUpdateItinerary(item.id)}
                      >
                        {itineraryActionBusyId === item.id ? "Saving..." : "Save"}
                      </button>
                      <button className="btn" type="button" onClick={cancelEditingItinerary}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="list-item-body">
                      <strong>{item.title}</strong>
                      <p className="muted">
                        {item.startsAt ? new Date(item.startsAt).toLocaleString() : "Anytime"}
                      </p>
                      {item.notes ? <p>{item.notes}</p> : null}
                    </div>
                    <div className="item-actions">
                      <button className="btn" type="button" onClick={() => startEditingItinerary(item)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        disabled={itineraryActionBusyId === item.id}
                        onClick={() => void handleDeleteItinerary(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card fade-up card-stack">
        <h3>Expenses</h3>
        <p className="muted">All expenses entered here are linked to this trip.</p>

        <form className="form-grid" onSubmit={handleAddExpense}>
          <label className="field">
            <span>Label</span>
            <input
              required
              minLength={2}
              value={expenseLabel}
              onChange={(event) => setExpenseLabel(event.target.value)}
              placeholder="Train pass"
            />
          </label>

          <div className="two-col-grid">
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                placeholder="36.50"
              />
            </label>

            <label className="field">
              <span>Currency</span>
              <select
                value={expenseCurrency}
                onChange={(event) => setExpenseCurrency(event.target.value as CurrencyCode)}
              >
                {majorCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Date (optional)</span>
            <input
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={expenseBusy}>
            {expenseBusy ? "Adding..." : "Add expense"}
          </button>
        </form>

        <ul className="list-stack">
          {trip.expenses.length === 0 ? (
            <li className="muted">No expenses yet.</li>
          ) : (
            trip.expenses.map((expense) => (
              <li key={expense.id} className="list-item list-item-left">
                {editingExpenseId === expense.id ? (
                  <div className="form-grid inline-editor">
                    <label className="field">
                      <span>Label</span>
                      <input
                        minLength={2}
                        value={editExpenseLabel}
                        onChange={(event) => setEditExpenseLabel(event.target.value)}
                      />
                    </label>

                    <div className="two-col-grid">
                      <label className="field">
                        <span>Amount</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editExpenseAmount}
                          onChange={(event) => setEditExpenseAmount(event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span>Currency</span>
                        <select
                          value={editExpenseCurrency}
                          onChange={(event) => setEditExpenseCurrency(event.target.value as CurrencyCode)}
                        >
                          {majorCurrencies.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="field">
                      <span>Date</span>
                      <input
                        type="date"
                        value={editExpenseDate}
                        onChange={(event) => setEditExpenseDate(event.target.value)}
                      />
                    </label>

                    <div className="item-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={expenseActionBusyId === expense.id}
                        onClick={() => void handleUpdateExpense(expense.id)}
                      >
                        {expenseActionBusyId === expense.id ? "Saving..." : "Save"}
                      </button>
                      <button className="btn" type="button" onClick={cancelEditingExpense}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="list-item-body">
                      <strong>{expense.label}</strong>
                      <p className="muted">
                        {new Date(expense.spentOn).toLocaleDateString()} | {expense.currency}
                      </p>
                    </div>
                    <span className="expense-amount">
                      {formatMoney(Number(expense.amount), expense.currency)}
                    </span>
                    <div className="item-actions">
                      <button className="btn" type="button" onClick={() => startEditingExpense(expense)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        disabled={expenseActionBusyId === expense.id}
                        onClick={() => void handleDeleteExpense(expense.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card fade-up card-stack">
        <h3>Linked Journals</h3>
        {trip.journalEntries.length === 0 ? (
          <p className="muted">No entries linked to this trip yet.</p>
        ) : (
          <ul className="list-stack">
            {trip.journalEntries.map((entry) => (
              <li key={entry.id} className="journal-item">
                {editingJournalId === entry.id ? (
                  <div className="form-grid inline-editor">
                    <label className="field">
                      <span>Title</span>
                      <input
                        value={editJournalTitle}
                        minLength={2}
                        maxLength={180}
                        onChange={(event) => setEditJournalTitle(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span>Mood</span>
                      <select
                        value={editJournalMood}
                        onChange={(event) => setEditJournalMood(event.target.value as Mood)}
                      >
                        {moods.map((mood) => (
                          <option key={mood} value={mood}>
                            {mood}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Entry</span>
                      <textarea
                        rows={6}
                        value={editJournalContent}
                        minLength={1}
                        maxLength={50000}
                        onChange={(event) => setEditJournalContent(event.target.value)}
                      />
                    </label>

                    <div className="item-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={journalActionBusyId === entry.id}
                        onClick={() => void handleUpdateJournal(entry.id)}
                      >
                        {journalActionBusyId === entry.id ? "Saving..." : "Save"}
                      </button>
                      <button className="btn" type="button" onClick={cancelEditingJournal}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="journal-item-head">
                      <strong>{entry.title}</strong>
                      <span className="pill">{entry.mood.toLowerCase()}</span>
                    </div>
                    <p>{entry.content.slice(0, 160)}{entry.content.length > 160 ? "..." : ""}</p>
                    <div className="item-actions">
                      <button className="btn" type="button" onClick={() => startEditingJournal(entry)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        disabled={journalActionBusyId === entry.id}
                        onClick={() => void handleDeleteJournal(entry.id)}
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
