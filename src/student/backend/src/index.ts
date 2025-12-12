// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// middlewares
app.use(cors());
app.use(express.json());

// test route
app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from TS Express backend 👋" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
