import express from "express";
import { authRouter } from "./router/auth.router";

const app = express();
const PORT = 8000;

app.use(express.json());
app.use("/api/v1/auth", authRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.listen(PORT, () => console.log(`Http server running on port ${PORT}`));
