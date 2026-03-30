import {
  CurrencyCode,
  Mood,
  Prisma,
  PrismaClient,
  TemplateKind,
} from "@prisma/client";

type SampleDataDbClient = PrismaClient | Prisma.TransactionClient;

type SampleSeedSummary = {
  tripCount: number;
  journalCount: number;
  itineraryCount: number;
  expenseCount: number;
};

export const SAMPLE_PREFIX = "Sample:";

function asDate(value: string) {
  return new Date(value);
}

export async function hasSampleDataForUser(db: SampleDataDbClient, userId: string) {
  const [sampleTripCount, sampleJournalCount] = await Promise.all([
    db.trip.count({
      where: {
        userId,
        location: {
          startsWith: SAMPLE_PREFIX,
        },
      },
    }),
    db.journalEntry.count({
      where: {
        userId,
        title: {
          startsWith: SAMPLE_PREFIX,
        },
      },
    }),
  ]);

  return sampleTripCount + sampleJournalCount > 0;
}

export async function removeSampleDataForUser(db: SampleDataDbClient, userId: string) {
  const deletedJournals = await db.journalEntry.deleteMany({
    where: {
      userId,
      title: {
        startsWith: SAMPLE_PREFIX,
      },
    },
  });

  const deletedTrips = await db.trip.deleteMany({
    where: {
      userId,
      location: {
        startsWith: SAMPLE_PREFIX,
      },
    },
  });

  return {
    deletedJournals: deletedJournals.count,
    deletedTrips: deletedTrips.count,
  };
}

export async function createSamplePackForUser(
  db: SampleDataDbClient,
  userId: string
): Promise<SampleSeedSummary> {
  await removeSampleDataForUser(db, userId);

  const barcelona = await db.trip.create({
    data: {
      userId,
      location: "Sample: Barcelona, Spain",
      budget: "1260.00",
      startDate: asDate("2026-07-05T00:00:00.000Z"),
      endDate: asDate("2026-07-11T00:00:00.000Z"),
      itineraryItems: {
        create: [
          {
            title: "Sunset at Bunkers del Carmel",
            startsAt: asDate("2026-07-06T18:00:00.000Z"),
            notes: "Carry a light jacket for wind.",
          },
          {
            title: "Gothic Quarter morning walk",
            startsAt: asDate("2026-07-07T08:15:00.000Z"),
            notes: "Stop for coffee near Placa Reial.",
          },
        ],
      },
      expenses: {
        create: [
          {
            label: "Tapas dinner",
            amount: "41.70",
            currency: CurrencyCode.EUR,
            spentOn: asDate("2026-07-06T20:40:00.000Z"),
          },
          {
            label: "Metro pass",
            amount: "26.40",
            currency: CurrencyCode.EUR,
            spentOn: asDate("2026-07-05T10:00:00.000Z"),
          },
        ],
      },
    },
  });

  const reykjavik = await db.trip.create({
    data: {
      userId,
      location: "Sample: Reykjavik, Iceland",
      budget: "1580.00",
      startDate: asDate("2026-09-14T00:00:00.000Z"),
      endDate: asDate("2026-09-20T00:00:00.000Z"),
      itineraryItems: {
        create: [
          {
            title: "Golden Circle day route",
            startsAt: asDate("2026-09-15T07:40:00.000Z"),
            notes: "Book crater stop in advance.",
          },
          {
            title: "Blue Lagoon evening soak",
            startsAt: asDate("2026-09-16T17:30:00.000Z"),
            notes: "Bring waterproof phone case.",
          },
          {
            title: "Harpa waterfront sunrise",
            startsAt: asDate("2026-09-17T05:50:00.000Z"),
            notes: "Best light before tour buses arrive.",
          },
        ],
      },
      expenses: {
        create: [
          {
            label: "Car rental split",
            amount: "210.00",
            currency: CurrencyCode.USD,
            spentOn: asDate("2026-09-14T11:30:00.000Z"),
          },
          {
            label: "Hot spring admission",
            amount: "92.00",
            currency: CurrencyCode.USD,
            spentOn: asDate("2026-09-16T17:20:00.000Z"),
          },
          {
            label: "Road snacks",
            amount: "18.90",
            currency: CurrencyCode.USD,
            spentOn: asDate("2026-09-15T12:05:00.000Z"),
          },
        ],
      },
    },
  });

  await db.journalEntry.createMany({
    data: [
      {
        userId,
        tripId: barcelona.id,
        title: "Sample: Rooftops at dusk",
        content:
          "The skyline looked cut from paper, all sharp edges and warm color. I stayed until the streets were just threads of light.",
        mood: Mood.HAPPY,
        template: TemplateKind.STANDARD,
      },
      {
        userId,
        tripId: reykjavik.id,
        title: "Sample: Lava fields and low clouds",
        content:
          "The road felt lunar, and every stop had a different weather mood. Cold hands, calm head.",
        mood: Mood.CALM,
        template: TemplateKind.BLANK,
      },
      {
        userId,
        tripId: null,
        title: "Sample: Notes before takeoff",
        content:
          "Left margin: things to notice. Right margin: things to let go. This format always helps me travel lighter.",
        mood: Mood.GRATEFUL,
        template: TemplateKind.BLANK,
      },
      {
        userId,
        tripId: null,
        title: "Sample: Midweek memory dump",
        content:
          "A short entry to keep momentum. The app feels better when even tiny moments make it into the journal.",
        mood: Mood.CALM,
        template: TemplateKind.STANDARD,
      },
    ],
  });

  const [tripCount, journalCount, itineraryCount, expenseCount] = await Promise.all([
    db.trip.count({ where: { userId } }),
    db.journalEntry.count({ where: { userId } }),
    db.itineraryItem.count({ where: { trip: { userId } } }),
    db.expense.count({ where: { trip: { userId } } }),
  ]);

  return { tripCount, journalCount, itineraryCount, expenseCount };
}
