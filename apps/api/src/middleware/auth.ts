import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Missing or invalid authorization header" });
	}

	const token = authHeader.replace("Bearer ", "").trim();

	try {
		req.auth = verifyAccessToken(token);
		return next();
	} catch {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
}

