import express from "express";
import cors from "cors";
import { authRouter } from "./router/auth.router";
import { userRouter } from "./router/user.router";
import { gameRouter } from "./router/game.router";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/games", gameRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "OK" });
});

app.listen(PORT, () => console.log(`Http server running on port ${PORT}`));
