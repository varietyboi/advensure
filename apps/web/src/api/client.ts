import type {
  CurrencyCode,
  FontMode,
  JournalEntry,
  Mood,
  TemplateKind,
  ThemeMode,
  ThemePreference,
  Trip,
  TripDetail,
  User,
} from "../types/models";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "advensure.accessToken";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let accessToken = window.localStorage.getItem(TOKEN_KEY);

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new ApiError(
      (body as { message?: string } | null)?.message ?? "Request failed",
      response.status,
      body
    );
  }

  return body as T;
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;

  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export async function register(email: string, password: string) {
  return request<{ accessToken: string; user: User }>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export async function login(email: string, password: string) {
  return request<{ accessToken: string; user: User }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function getMe() {
  return request<{ user: User }>("/auth/me");
}

export async function getTrips() {
  return request<{ trips: Trip[] }>("/trips");
}

export async function createTrip(payload: {
  location: string;
  budget?: number;
  startDate: string;
  endDate: string;
}) {
  return request<{ trip: Trip }>("/trips", {
    method: "POST",
    body: payload,
  });
}

export async function updateTrip(
  tripId: string,
  payload: {
    location?: string;
    budget?: number | null;
    startDate?: string;
    endDate?: string;
  }
) {
  return request<{ trip: Trip }>(`/trips/${tripId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteTrip(tripId: string) {
  return request<void>(`/trips/${tripId}`, {
    method: "DELETE",
  });
}

export async function getTrip(tripId: string) {
  return request<{ trip: TripDetail }>(`/trips/${tripId}`);
}

export async function addItineraryItem(
  tripId: string,
  payload: { title: string; startsAt?: string; notes?: string }
) {
  return request(`/trips/${tripId}/itinerary`, {
    method: "POST",
    body: payload,
  });
}

export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  payload: { title?: string; startsAt?: string | null; notes?: string | null }
) {
  return request(`/trips/${tripId}/itinerary/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteItineraryItem(tripId: string, itemId: string) {
  return request<void>(`/trips/${tripId}/itinerary/${itemId}`, {
    method: "DELETE",
  });
}

export async function addExpense(
  tripId: string,
  payload: { label: string; amount: number; currency?: CurrencyCode; spentOn?: string }
) {
  return request(`/trips/${tripId}/expenses`, {
    method: "POST",
    body: payload,
  });
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  payload: { label?: string; amount?: number; currency?: CurrencyCode; spentOn?: string | null }
) {
  return request(`/trips/${tripId}/expenses/${expenseId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteExpense(tripId: string, expenseId: string) {
  return request<void>(`/trips/${tripId}/expenses/${expenseId}`, {
    method: "DELETE",
  });
}

export async function getJournals(tripId?: string) {
  const query = tripId ? `?tripId=${encodeURIComponent(tripId)}` : "";
  return request<{ journalEntries: JournalEntry[] }>(`/journals${query}`);
}

export async function createJournal(payload: {
  title: string;
  content: string;
  mood: Mood;
  template: TemplateKind;
  tripId?: string;
}) {
  return request<{ journalEntry: JournalEntry }>("/journals", {
    method: "POST",
    body: payload,
  });
}

export async function updateJournal(
  entryId: string,
  payload: {
    title?: string;
    content?: string;
    mood?: Mood;
    template?: TemplateKind;
    tripId?: string | null;
  }
) {
  return request<{ journalEntry: JournalEntry }>(`/journals/${entryId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteJournal(entryId: string) {
  return request<void>(`/journals/${entryId}`, {
    method: "DELETE",
  });
}

export async function getPreferences() {
  return request<{ preference: ThemePreference }>("/preferences");
}

export async function savePreferences(payload: { fontMode?: FontMode; themeMode?: ThemeMode }) {
  return request<{ preference: ThemePreference }>("/preferences", {
    method: "PUT",
    body: payload,
  });
}

export async function getSampleDataStatus() {
  return request<{ hasSampleData: boolean }>("/preferences/sample-data-status");
}

export async function removeSampleData() {
  return request<{
    hasSampleData: boolean;
    removed: { deletedJournals: number; deletedTrips: number };
  }>("/preferences/sample-data", {
    method: "DELETE",
  });
}
