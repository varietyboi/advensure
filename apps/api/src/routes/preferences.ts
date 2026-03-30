import { FontMode, ThemeMode } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { hasSampleDataForUser, removeSampleDataForUser } from "../lib/sampleData";
import { requireAuth } from "../middleware/auth";

const updatePreferencesSchema = z.object({
  fontMode: z.nativeEnum(FontMode).optional(),
  themeMode: z.nativeEnum(ThemeMode).optional(),
});

export const preferencesRouter = Router();

preferencesRouter.use(requireAuth);

preferencesRouter.get("/sample-data-status", async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const hasSampleData = await hasSampleDataForUser(prisma, req.auth.userId);

  return res.json({ hasSampleData });
});

preferencesRouter.delete("/sample-data", async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await removeSampleDataForUser(prisma, req.auth.userId);

  return res.json({
    removed: result,
    hasSampleData: false,
  });
});

preferencesRouter.get("/", async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let pref = await prisma.themePreference.findUnique({
    where: { userId: req.auth.userId },
  });

  if (!pref) {
    pref = await prisma.themePreference.create({
      data: {
        userId: req.auth.userId,
      },
    });
  }

  return res.json({ preference: pref });
});

preferencesRouter.put("/", async (req, res) => {
  if (!req.auth) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = updatePreferencesSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const preference = await prisma.themePreference.upsert({
    where: { userId: req.auth.userId },
    create: {
      userId: req.auth.userId,
      fontMode: parsed.data.fontMode,
      themeMode: parsed.data.themeMode,
    },
    update: {
      ...(parsed.data.fontMode ? { fontMode: parsed.data.fontMode } : {}),
      ...(parsed.data.themeMode ? { themeMode: parsed.data.themeMode } : {}),
    },
  });

  return res.json({ preference });
});
