import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = new Database("trades.db");

  // Initialize DB
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market TEXT,
      direction TEXT,
      strike TEXT,
      entry_price REAL,
      stop_loss REAL,
      target_price REAL,
      risk_amount REAL,
      lot_size INTEGER,
      reason TEXT,
      confidence INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.use(express.json());

  // API routes
  app.get("/api/trades", (req, res) => {
    const trades = db.prepare("SELECT * FROM trades ORDER BY timestamp DESC").all();
    res.json(trades);
  });

  app.post("/api/trades", (req, res) => {
    const { 
      Market, Direction, Strike, Entry_Price, Stop_Loss, 
      Target_Price, Risk_Amount, Lot_Size, Reason_For_Entry, 
      Confidence_Score_0_to_10 
    } = req.body;

    const info = db.prepare(`
      INSERT INTO trades (
        market, direction, strike, entry_price, stop_loss, 
        target_price, risk_amount, lot_size, reason, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Market, Direction, Strike, Entry_Price, Stop_Loss, 
      Target_Price, Risk_Amount, Lot_Size, Reason_For_Entry, 
      Confidence_Score_0_to_10
    );

    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
