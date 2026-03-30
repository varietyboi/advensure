import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { authRouter } from "./routes/auth";
import { journalsRouter } from "./routes/journals";
import { preferencesRouter } from "./routes/preferences";
import { tripsRouter } from "./routes/trips";

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "AdvenSure API",
      status: "ok",
      health: "/health",
      routes: ["/auth", "/journals", "/trips", "/preferences"],
    });
  });

  app.use("/auth", authRouter);
  app.use("/journals", journalsRouter);
  app.use("/trips", tripsRouter);
  app.use("/preferences", preferencesRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    res.status(500).json({ message: "Internal server error", details: message });
  });

  return app;
}
