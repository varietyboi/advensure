import "dotenv/config";

import { Mood, PrismaClient, TemplateKind } from "@prisma/client";

import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@advensure.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "DemoPass123!";
const SAMPLE_PREFIX = "Sample:";

function asDate(value: string) {
  return new Date(value);
}

async function seedSamplePackForUser(userId: string) {
  await prisma.journalEntry.deleteMany({
    where: {
      userId,
      title: {
        startsWith: SAMPLE_PREFIX,
      },
    },
  });

  await prisma.trip.deleteMany({
    where: {
      userId,
      location: {
        startsWith: SAMPLE_PREFIX,
      },
    },
  });

  const barcelona = await prisma.trip.create({
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
            spentOn: asDate("2026-07-06T20:40:00.000Z"),
          },
          {
            label: "Metro pass",
            amount: "26.40",
            spentOn: asDate("2026-07-05T10:00:00.000Z"),
          },
        ],
      },
    },
  });

  const reykjavik = await prisma.trip.create({
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
            spentOn: asDate("2026-09-14T11:30:00.000Z"),
          },
          {
            label: "Hot spring admission",
            amount: "92.00",
            spentOn: asDate("2026-09-16T17:20:00.000Z"),
          },
          {
            label: "Road snacks",
            amount: "18.90",
            spentOn: asDate("2026-09-15T12:05:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.journalEntry.createMany({
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
    prisma.trip.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.itineraryItem.count({ where: { trip: { userId } } }),
    prisma.expense.count({ where: { trip: { userId } } }),
  ]);

  return { tripCount, journalCount, itineraryCount, expenseCount };
}

async function run() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });

  await prisma.themePreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      fontMode: "STANDARD",
      themeMode: "LIGHT",
    },
    update: {
      fontMode: "STANDARD",
      themeMode: "LIGHT",
    },
  });

  // Rebuild only this demo account's travel graph so script can be rerun safely.
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } });
  await prisma.trip.deleteMany({ where: { userId: user.id } });

  const kyoto = await prisma.trip.create({
    data: {
      userId: user.id,
      location: "Kyoto, Japan",
      budget: "1850.00",
      startDate: asDate("2026-04-12T00:00:00.000Z"),
      endDate: asDate("2026-04-20T00:00:00.000Z"),
      itineraryItems: {
        create: [
          {
            title: "Sunrise walk through Fushimi Inari",
            startsAt: asDate("2026-04-13T21:00:00.000Z"),
            notes: "Carry light rain shell and water.",
          },
          {
            title: "Tea ceremony in Gion",
            startsAt: asDate("2026-04-14T06:30:00.000Z"),
            notes: "Arrive 10 minutes early.",
          },
          {
            title: "Golden hour at Kiyomizu-dera",
            startsAt: asDate("2026-04-15T09:45:00.000Z"),
            notes: "Best photos from the veranda lookout.",
          },
        ],
      },
      expenses: {
        create: [
          {
            label: "ICOCA transit card",
            amount: "45.00",
            spentOn: asDate("2026-04-12T08:10:00.000Z"),
          },
          {
            label: "Ryokan night stay",
            amount: "220.00",
            spentOn: asDate("2026-04-13T12:00:00.000Z"),
          },
          {
            label: "Matcha tasting flight",
            amount: "32.50",
            spentOn: asDate("2026-04-14T08:00:00.000Z"),
          },
        ],
      },
    },
  });

  const lisbon = await prisma.trip.create({
    data: {
      userId: user.id,
      location: "Lisbon, Portugal",
      budget: "980.00",
      startDate: asDate("2026-05-04T00:00:00.000Z"),
      endDate: asDate("2026-05-10T00:00:00.000Z"),
      itineraryItems: {
        create: [
          {
            title: "Alfama alley wander",
            startsAt: asDate("2026-05-05T09:00:00.000Z"),
            notes: "No maps for first hour.",
          },
          {
            title: "Tram 28 loop",
            startsAt: asDate("2026-05-06T07:20:00.000Z"),
            notes: "Board early to avoid long queue.",
          },
        ],
      },
      expenses: {
        create: [
          {
            label: "Pastel de nata crawl",
            amount: "18.20",
            spentOn: asDate("2026-05-05T15:10:00.000Z"),
          },
          {
            label: "Day pass",
            amount: "7.00",
            spentOn: asDate("2026-05-06T08:40:00.000Z"),
          },
          {
            label: "Fado dinner",
            amount: "64.00",
            spentOn: asDate("2026-05-07T21:20:00.000Z"),
          },
        ],
      },
    },
  });

  const peru = await prisma.trip.create({
    data: {
      userId: user.id,
      location: "Cusco & Sacred Valley, Peru",
      budget: "1450.00",
      startDate: asDate("2026-06-18T00:00:00.000Z"),
      endDate: asDate("2026-06-26T00:00:00.000Z"),
      itineraryItems: {
        create: [
          {
            title: "Acclimatization day in Cusco",
            startsAt: asDate("2026-06-18T16:30:00.000Z"),
            notes: "Hydrate and keep pace easy.",
          },
          {
            title: "Pisac market and terraces",
            startsAt: asDate("2026-06-20T12:00:00.000Z"),
            notes: "Try the quinoa soup near the church square.",
          },
          {
            title: "Machu Picchu dawn train",
            startsAt: asDate("2026-06-23T09:15:00.000Z"),
            notes: "Passport and entry ticket ready.",
          },
        ],
      },
      expenses: {
        create: [
          {
            label: "Airport transfer",
            amount: "25.00",
            spentOn: asDate("2026-06-18T15:45:00.000Z"),
          },
          {
            label: "Train + park ticket",
            amount: "280.00",
            spentOn: asDate("2026-06-22T19:20:00.000Z"),
          },
          {
            label: "Guide for citadel route",
            amount: "65.00",
            spentOn: asDate("2026-06-23T13:10:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.journalEntry.createMany({
    data: [
      {
        userId: user.id,
        tripId: kyoto.id,
        title: "Lantern shadows in Gion",
        content:
          "I took the long route back to the inn and followed the rhythm of wooden sandals on stone. Even the narrow lanes felt ceremonial at night.",
        mood: Mood.GRATEFUL,
        template: TemplateKind.STANDARD,
      },
      {
        userId: user.id,
        tripId: kyoto.id,
        title: "Arashiyama before the crowds",
        content:
          "The bamboo grove was almost silent at 6:30 AM. I could hear the wind bend the stalks before I could see it.",
        mood: Mood.CALM,
        template: TemplateKind.BLANK,
      },
      {
        userId: user.id,
        tripId: lisbon.id,
        title: "Yellow tram and sea air",
        content:
          "The tram squealed around every curve and the Atlantic breeze kept sneaking through open windows. I never wanted the loop to end.",
        mood: Mood.HAPPY,
        template: TemplateKind.STANDARD,
      },
      {
        userId: user.id,
        tripId: lisbon.id,
        title: "Blue hour at Miradouro da Senhora do Monte",
        content:
          "The city turned copper and violet as church bells started ringing. I stayed until the lights stitched the hills together.",
        mood: Mood.GRATEFUL,
        template: TemplateKind.BLANK,
      },
      {
        userId: user.id,
        tripId: peru.id,
        title: "Breathing slower in Cusco",
        content:
          "Altitude made me slow down in the best way. Every staircase asked for patience, and that made every view feel earned.",
        mood: Mood.TIRED,
        template: TemplateKind.STANDARD,
      },
      {
        userId: user.id,
        tripId: peru.id,
        title: "First glimpse of the citadel",
        content:
          "Clouds moved like curtains and the terraces appeared in layers. The whole valley felt impossibly deliberate.",
        mood: Mood.HAPPY,
        template: TemplateKind.STANDARD,
      },
      {
        userId: user.id,
        tripId: null,
        title: "Packing list that became a promise",
        content:
          "I wrote down fewer outfits and more intentions this time: sleep well, listen carefully, and leave room for detours.",
        mood: Mood.CALM,
        template: TemplateKind.BLANK,
      },
      {
        userId: user.id,
        tripId: null,
        title: "Airport notebook page",
        content:
          "Between gate changes and espresso refills, I sketched a rough map of where I want to feel unhurried this year.",
        mood: Mood.STRESSED,
        template: TemplateKind.BLANK,
      },
    ],
  });

  const [tripCount, journalCount, itineraryCount, expenseCount] = await Promise.all([
    prisma.trip.count({ where: { userId: user.id } }),
    prisma.journalEntry.count({ where: { userId: user.id } }),
    prisma.itineraryItem.count({ where: { trip: { userId: user.id } } }),
    prisma.expense.count({ where: { trip: { userId: user.id } } }),
  ]);

  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        not: DEMO_EMAIL,
      },
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const sampleSummaries: Array<{
    email: string;
    tripCount: number;
    journalCount: number;
    itineraryCount: number;
    expenseCount: number;
  }> = [];

  for (const existingUser of existingUsers) {
    const summary = await seedSamplePackForUser(existingUser.id);
    sampleSummaries.push({ email: existingUser.email, ...summary });
  }

  console.log("Demo seed complete.");
  console.log(`Demo account: ${DEMO_EMAIL}`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
  console.log(
    `Created ${tripCount} trips, ${journalCount} journals, ${itineraryCount} itinerary items, ${expenseCount} expenses.`
  );

  if (sampleSummaries.length > 0) {
    console.log("Sample packs refreshed for existing users:");

    for (const summary of sampleSummaries) {
      console.log(
        `- ${summary.email}: ${summary.tripCount} trips, ${summary.journalCount} journals, ${summary.itineraryCount} itinerary items, ${summary.expenseCount} expenses.`
      );
    }
  }
}

run()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });