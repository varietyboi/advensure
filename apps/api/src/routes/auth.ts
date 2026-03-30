import { Router } from "express";
import { z } from "zod";

import { comparePassword, hashPassword, signAccessToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { createSamplePackForUser } from "../lib/sampleData";
import { requireAuth } from "../middleware/auth";

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).max(72),
});

const loginSchema = registerSchema;

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
	const parsed = registerSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const email = parsed.data.email.trim().toLowerCase();
	const existing = await prisma.user.findUnique({ where: { email } });

	if (existing) {
		return res.status(409).json({ message: "Email already registered" });
	}

	const passwordHash = await hashPassword(parsed.data.password);

	const user = await prisma.$transaction(async (tx) => {
		const created = await tx.user.create({
			data: {
				email,
				passwordHash,
			},
		});

		await tx.themePreference.create({
			data: {
				userId: created.id,
			},
		});

		await createSamplePackForUser(tx, created.id);

		return created;
	});

	const accessToken = signAccessToken({ userId: user.id, email: user.email });

	return res.status(201).json({
		accessToken,
		user: {
			id: user.id,
			email: user.email,
		},
	});
});

authRouter.post("/login", async (req, res) => {
	const parsed = loginSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
	}

	const email = parsed.data.email.trim().toLowerCase();
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		return res.status(401).json({ message: "Invalid email or password" });
	}

	const isValidPassword = await comparePassword(parsed.data.password, user.passwordHash);

	if (!isValidPassword) {
		return res.status(401).json({ message: "Invalid email or password" });
	}

	const accessToken = signAccessToken({ userId: user.id, email: user.email });

	return res.json({
		accessToken,
		user: {
			id: user.id,
			email: user.email,
		},
	});
});

authRouter.get("/me", requireAuth, async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const user = await prisma.user.findUnique({
		where: { id: req.auth.userId },
		select: { id: true, email: true, createdAt: true },
	});

	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}

	return res.json({ user });
});

authRouter.delete("/account", requireAuth, async (req, res) => {
	if (!req.auth) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const existing = await prisma.user.findUnique({
		where: { id: req.auth.userId },
		select: { id: true },
	});

	if (!existing) {
		return res.status(404).json({ message: "User not found" });
	}

	await prisma.user.delete({ where: { id: req.auth.userId } });

	return res.status(204).send();
});

