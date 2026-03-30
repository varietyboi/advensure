import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
