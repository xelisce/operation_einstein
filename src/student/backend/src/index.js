import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors({ origin: "http://localhost:3000" })); 
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ ok: true, message: "Backend is up" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
