import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const jwtSecret = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: string;
  username: string;
  avatar: string;
}

export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: "240h" }) as string;
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, jwtSecret) as JwtPayload;
};

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
