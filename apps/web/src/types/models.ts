export type ThemeMode = "LIGHT" | "DARK";
export type FontMode = "TYPEWRITER" | "HANDWRITING" | "STANDARD" | "BOHEMIAN_TYPEWRITER";
export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CNY"
  | "INR"
  | "AUD"
  | "CAD"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "NZD"
  | "SGD"
  | "HKD"
  | "KRW"
  | "AED"
  | "SAR"
  | "QAR"
  | "KWD"
  | "BHD"
  | "OMR"
  | "TRY"
  | "ZAR"
  | "BRL"
  | "MXN"
  | "ARS"
  | "CLP"
  | "COP"
  | "PEN"
  | "IDR"
  | "THB"
  | "MYR"
  | "PHP"
  | "VND"
  | "RUB"
  | "PLN"
  | "CZK"
  | "HUF"
  | "RON"
  | "ILS"
  | "EGP"
  | "NGN"
  | "PKR"
  | "BDT"
  | "LKR";
export type Mood = "CALM" | "HAPPY" | "TIRED" | "GRATEFUL" | "STRESSED";
export type TemplateKind = "BLANK" | "STANDARD";

export type User = {
  id: string;
  email: string;
  createdAt?: string;
};

export type Trip = {
  id: string;
  location: string;
  budget: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  template: TemplateKind;
  tripId: string | null;
  createdAt: string;
  updatedAt: string;
  trip?: {
    id: string;
    location: string;
  } | null;
};

export type ItineraryItem = {
  id: string;
  title: string;
  startsAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  label: string;
  amount: string;
  currency: CurrencyCode;
  spentOn: string;
  createdAt: string;
};

export type TripDetail = Trip & {
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
  journalEntries: JournalEntry[];
};

export type ThemePreference = {
  id?: string;
  fontMode: FontMode;
  themeMode: ThemeMode;
  updatedAt?: string;
};
