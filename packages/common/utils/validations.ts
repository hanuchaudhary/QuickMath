import { z } from "zod";
import { GameMode, GameType } from "./constants";

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const updateProfileSchema = z.object({
  avatar: z.string().max(500).optional(),
});

export const createCustomRoomSchema = z.object({
  gameType: z.enum(GameType),
  gameMode: z.enum(GameMode),
  gameConfig: z.object({
    difficulty: z.enum(["easy", "medium", "hard"]),
    timeLimit: z.number().min(1).max(5),
    maxPlayers: z.number().min(2).max(8),
  }),
});

export const joinCustomRoomSchema = z.object({
  joinCode: z.string(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type CreateCustomRoomSchema = z.infer<typeof createCustomRoomSchema>;
export type JoinCustomRoomSchema = z.infer<typeof joinCustomRoomSchema>;
