console.log('Starting server...');
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const submissionsRouter = require("./routes/submissions");
const leaderboardRouter = require("./routes/leaderboard");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/submit", submissionsRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
