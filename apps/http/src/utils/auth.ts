import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { redis } from "@quickmath/db";

const jwtSecret = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "240h";
const blacklistKey = (jti: string) => `jwt:blacklist:${jti}`;

export interface JwtPayload {
  id: string;
  username: string;
  avatar: string;
  jti: string;
}

export const generateToken = (payload: Omit<JwtPayload, "jti">) => {
  return jwt.sign({ ...payload, jti: randomUUID() }, jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  }) as string;
};

export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!decoded.jti) {
      return null;
    }

    const isBlacklisted = await redis.exists(blacklistKey(decoded.jti));
    if (isBlacklisted) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

export const blacklistToken = async (token: string) => {
  const decoded = jwt.verify(token, jwtSecret) as JwtPayload & { exp?: number };
  if (!decoded.jti) {
    throw new Error("Token is missing a jti");
  }

  const ttlSeconds = decoded.exp
    ? Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1)
    : 240 * 60 * 60;

  await redis.set(blacklistKey(decoded.jti), "1", "EX", ttlSeconds);
};

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
