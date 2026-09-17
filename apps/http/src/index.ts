import express from "express";
import { authRouter } from "./router/auth.router";

const app = express();
const PORT = 8000;

app.use(express.json());
app.use("/api/v1/auth", authRouter);

app.listen(PORT, () => console.log(`http server running on port ${PORT}`));
