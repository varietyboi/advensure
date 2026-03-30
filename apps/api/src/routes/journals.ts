import { Mood, TemplateKind } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const createJournalSchema = z.object({
	title: z.string().min(2).max(180),
	content: z.string().min(1).max(50000),
	mood: z.nativeEnum(Mood),
	template: z.nativeEnum(TemplateKind),
	tripId: z.string().cuid().optional(),
});

const updateJournalSchema = z.object({
	title: z.string().min(2).max(180).optional(),
	content: z.string().min(1).max(50000).optional(),
	mood: z.nativeEnum(Mood).optional(),
	template: z.nativeEnum(TemplateKind).optional(),
	tripId: z.string().cuid().nullable().optional(),
});

export const journalsRouter = Router();

journalsRouter.use(requireAuth);

journalsRouter.get("/", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;

	const journalEntries = await prisma.journalEntry.findMany({
		where: {
			userId: req.auth.userId,
			...(tripId ? { tripId } : {}),
		},
		orderBy: [{ createdAt: "desc" }],
		include: {
			trip: {
				select: {
					id: true,
					location: true,
				},
			},
		},
	});

	return res.json({ journalEntries });
});

journalsRouter.post("/", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = createJournalSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	if (parsed.data.tripId) {
		const trip = await prisma.trip.findFirst({
			where: {
				id: parsed.data.tripId,
				userId: req.auth.userId,
			},
		});

		if (!trip) {
			return res.status(404).json({ message: "Trip not found" });
		}
	}

	const journalEntry = await prisma.journalEntry.create({
		data: {
			userId: req.auth.userId,
			title: parsed.data.title,
			content: parsed.data.content,
			mood: parsed.data.mood,
			template: parsed.data.template,
			tripId: parsed.data.tripId ?? null,
		},
	});

	return res.status(201).json({ journalEntry });
});

journalsRouter.patch("/:entryId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = updateJournalSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const existing = await prisma.journalEntry.findFirst({
		where: {
			id: req.params.entryId,
			userId: req.auth.userId,
		},
	});

	if (!existing) {
		return res.status(404).json({ message: "Journal entry not found" });
	}

	if (parsed.data.tripId) {
		const trip = await prisma.trip.findFirst({
			where: {
				id: parsed.data.tripId,
				userId: req.auth.userId,
			},
		});

		if (!trip) {
			return res.status(404).json({ message: "Trip not found" });
		}
	}

	const updated = await prisma.journalEntry.update({
		where: { id: existing.id },
		data: {
			...(parsed.data.title ? { title: parsed.data.title } : {}),
			...(parsed.data.content ? { content: parsed.data.content } : {}),
			...(parsed.data.mood ? { mood: parsed.data.mood } : {}),
			...(parsed.data.template ? { template: parsed.data.template } : {}),
			...(parsed.data.tripId !== undefined ? { tripId: parsed.data.tripId } : {}),
		},
	});

	return res.json({ journalEntry: updated });
});

journalsRouter.delete("/:entryId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const existing = await prisma.journalEntry.findFirst({
		where: {
			id: req.params.entryId,
			userId: req.auth.userId,
		},
	});

	if (!existing) {
		return res.status(404).json({ message: "Journal entry not found" });
	}

	await prisma.journalEntry.delete({ where: { id: existing.id } });

	return res.status(204).send();
});

