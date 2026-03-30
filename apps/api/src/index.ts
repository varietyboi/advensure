import "dotenv/config";

import { createServer } from "./server";

const port = Number(process.env.PORT ?? 4000);

if (!process.env.JWT_SECRET) {
	console.warn("JWT_SECRET is not set. Using fallback secret for local development only.");
}

const app = createServer();

app.listen(port, () => {
	console.log(`AdvenSure API listening on http://localhost:${port}`);
});

