import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;

export const generateToken = (payload: any) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, jwtSecret);
};

export const generateScore = (timeTaken: number) => {
  return Math.floor(1000000 / timeTaken);
};
