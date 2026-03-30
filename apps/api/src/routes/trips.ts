import { CurrencyCode } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const createTripSchema = z.object({
	location: z.string().min(2).max(120),
	budget: z.coerce.number().min(0).max(999999.99).optional(),
	startDate: z.string().min(1),
	endDate: z.string().min(1),
});

const updateTripSchema = z
	.object({
		location: z.string().min(2).max(120).optional(),
		budget: z.union([z.coerce.number().min(0).max(999999.99), z.null()]).optional(),
		startDate: z.string().min(1).optional(),
		endDate: z.string().min(1).optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

const createItinerarySchema = z.object({
	title: z.string().min(2).max(160),
	startsAt: z.string().datetime().optional(),
	notes: z.string().max(2000).optional(),
});

const updateItinerarySchema = z
	.object({
		title: z.string().min(2).max(160).optional(),
		startsAt: z.string().datetime().nullable().optional(),
		notes: z.string().max(2000).nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

const createExpenseSchema = z.object({
	label: z.string().min(2).max(160),
	amount: z.coerce.number().positive().max(999999.99),
	currency: z.nativeEnum(CurrencyCode).optional(),
	spentOn: z.string().datetime().optional(),
});

const updateExpenseSchema = z
	.object({
		label: z.string().min(2).max(160).optional(),
		amount: z.coerce.number().positive().max(999999.99).optional(),
		currency: z.nativeEnum(CurrencyCode).optional(),
		spentOn: z.string().datetime().nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

function parseDate(value: string) {
	const next = new Date(value);
	return Number.isNaN(next.valueOf()) ? null : next;
}

async function findOwnedTrip(tripId: string, userId: string) {
	return prisma.trip.findFirst({
		where: {
			id: tripId,
			userId,
		},
	});
}

async function findOwnedItineraryItem(tripId: string, itineraryId: string, userId: string) {
	return prisma.itineraryItem.findFirst({
		where: {
			id: itineraryId,
			tripId,
			trip: {
				userId,
			},
		},
	});
}

async function findOwnedExpense(tripId: string, expenseId: string, userId: string) {
	return prisma.expense.findFirst({
		where: {
			id: expenseId,
			tripId,
			trip: {
				userId,
			},
		},
	});
}

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

tripsRouter.get("/", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const trips = await prisma.trip.findMany({
		where: { userId: req.auth.userId },
		orderBy: { startDate: "desc" },
	});

	return res.json({ trips });
});

tripsRouter.post("/", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = createTripSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const startDate = new Date(parsed.data.startDate);
	const endDate = new Date(parsed.data.endDate);

	if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf()) || endDate < startDate) {
		return res.status(400).json({ message: "Invalid date range" });
	}

	const trip = await prisma.trip.create({
		data: {
			userId: req.auth.userId,
			location: parsed.data.location,
			startDate,
			endDate,
			...(parsed.data.budget !== undefined ? { budget: parsed.data.budget.toFixed(2) } : {}),
		},
	});

	return res.status(201).json({ trip });
});

tripsRouter.patch("/:tripId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = updateTripSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const existing = await findOwnedTrip(req.params.tripId, req.auth.userId);

	if (!existing) {
		return res.status(404).json({ message: "Trip not found" });
	}

	const nextStart = parsed.data.startDate ? parseDate(parsed.data.startDate) : existing.startDate;
	const nextEnd = parsed.data.endDate ? parseDate(parsed.data.endDate) : existing.endDate;

	if (!nextStart || !nextEnd || nextEnd < nextStart) {
		return res.status(400).json({ message: "Invalid date range" });
	}

	const trip = await prisma.trip.update({
		where: { id: existing.id },
		data: {
			...(parsed.data.location !== undefined ? { location: parsed.data.location } : {}),
			...(parsed.data.budget !== undefined
				? { budget: parsed.data.budget === null ? null : parsed.data.budget.toFixed(2) }
				: {}),
			...(parsed.data.startDate ? { startDate: nextStart } : {}),
			...(parsed.data.endDate ? { endDate: nextEnd } : {}),
		},
	});

	return res.json({ trip });
});

tripsRouter.delete("/:tripId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const trip = await findOwnedTrip(req.params.tripId, req.auth.userId);

	if (!trip) {
		return res.status(404).json({ message: "Trip not found" });
	}

	await prisma.trip.delete({
		where: { id: trip.id },
	});

	return res.status(204).send();
});

tripsRouter.get("/:tripId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const trip = await prisma.trip.findFirst({
		where: {
			id: req.params.tripId,
			userId: req.auth.userId,
		},
		include: {
			itineraryItems: {
				orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
			},
			expenses: {
				orderBy: [{ spentOn: "desc" }],
			},
			journalEntries: {
				orderBy: [{ createdAt: "desc" }],
			},
		},
	});

	if (!trip) {
		return res.status(404).json({ message: "Trip not found" });
	}

	return res.json({ trip });
});

tripsRouter.post("/:tripId/itinerary", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = createItinerarySchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const trip = await findOwnedTrip(req.params.tripId, req.auth.userId);

	if (!trip) {
		return res.status(404).json({ message: "Trip not found" });
	}

	const itineraryItem = await prisma.itineraryItem.create({
		data: {
			tripId: trip.id,
			title: parsed.data.title,
			notes: parsed.data.notes,
			startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
		},
	});

	return res.status(201).json({ itineraryItem });
});

tripsRouter.patch("/:tripId/itinerary/:itemId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = updateItinerarySchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const itineraryItem = await findOwnedItineraryItem(req.params.tripId, req.params.itemId, req.auth.userId);

	if (!itineraryItem) {
		return res.status(404).json({ message: "Itinerary item not found" });
	}

	const updated = await prisma.itineraryItem.update({
		where: { id: itineraryItem.id },
		data: {
			...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
			...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
			...(parsed.data.startsAt !== undefined
				? { startsAt: parsed.data.startsAt === null ? null : new Date(parsed.data.startsAt) }
				: {}),
		},
	});

	return res.json({ itineraryItem: updated });
});

tripsRouter.delete("/:tripId/itinerary/:itemId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const itineraryItem = await findOwnedItineraryItem(req.params.tripId, req.params.itemId, req.auth.userId);

	if (!itineraryItem) {
		return res.status(404).json({ message: "Itinerary item not found" });
	}

	await prisma.itineraryItem.delete({ where: { id: itineraryItem.id } });

	return res.status(204).send();
});

tripsRouter.post("/:tripId/expenses", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = createExpenseSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const trip = await findOwnedTrip(req.params.tripId, req.auth.userId);

	if (!trip) {
		return res.status(404).json({ message: "Trip not found" });
	}

	const expense = await prisma.expense.create({
		data: {
			tripId: trip.id,
			label: parsed.data.label,
			amount: parsed.data.amount.toFixed(2),
			currency: parsed.data.currency ?? CurrencyCode.USD,
			spentOn: parsed.data.spentOn ? new Date(parsed.data.spentOn) : undefined,
		},
	});

	return res.status(201).json({ expense });
});

tripsRouter.patch("/:tripId/expenses/:expenseId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const parsed = updateExpenseSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const expense = await findOwnedExpense(req.params.tripId, req.params.expenseId, req.auth.userId);

	if (!expense) {
		return res.status(404).json({ message: "Expense not found" });
	}

	const updated = await prisma.expense.update({
		where: { id: expense.id },
		data: {
			...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
			...(parsed.data.amount !== undefined ? { amount: parsed.data.amount.toFixed(2) } : {}),
			...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
			...(parsed.data.spentOn !== undefined
				? { spentOn: parsed.data.spentOn === null ? undefined : new Date(parsed.data.spentOn) }
				: {}),
		},
	});

	return res.json({ expense: updated });
});

tripsRouter.delete("/:tripId/expenses/:expenseId", async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const expense = await findOwnedExpense(req.params.tripId, req.params.expenseId, req.auth.userId);

	if (!expense) {
		return res.status(404).json({ message: "Expense not found" });
	}

	await prisma.expense.delete({ where: { id: expense.id } });

	return res.status(204).send();
});

