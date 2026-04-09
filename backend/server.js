const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const { log } = require("console");

const app = express();
const PORT = 8000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static("../frontend/public"));

// ── DB Config ────────────────────────────────────────────────
// ⚠️  CHANGE these values to match your MySQL setup
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,          // default MySQL port, change if different
  user: "root",        // your MySQL username
  password: "Yash1976",            // ← your MySQL password (leave empty string if no password)
  database: "echo_grooves",
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed!");
    console.error("   Reason:", err.message);
    console.error("\n   Check:");
    console.error("   1. Is MySQL running in MySQL Workbench?");
    console.error("   2. Is the password correct in server.js?");
    console.error("   3. Did you run database.sql in Workbench?\n");
    process.exit(1); // stop server if DB fails
  }
  console.log("✅ Connected to MySQL (echo_grooves)");
  console.log(`🚀 Server running at http://localhost:${PORT}\n`);
});

// ── Helper ───────────────────────────────────────────────────
const query = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, results) =>
      err ? reject(err) : resolve(results)
    )
  );

// ════════════════════════════════════════════════════════════
//  VINYL ROUTES
// ════════════════════════════════════════════════════════════

app.get("/api/vinyls", async (req, res) => {
  try {
    let sql = "SELECT * FROM vinyls WHERE 1=1";
    const vals = [];

    if (req.query.genre) {
      sql += " AND genre = ?";
      vals.push(req.query.genre);
    }
    if (req.query.search) {
      sql += " AND (title LIKE ? OR artist LIKE ?)";
      vals.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    sql += " ORDER BY created_at DESC";
    const rows = await query(sql, vals);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/vinyls/:id", async (req, res) => {
  try {
    const [vinyl] = await query("SELECT * FROM vinyls WHERE id = ?", [req.params.id]);
    if (!vinyl) return res.status(404).json({ error: "Vinyl not found" });
    res.json(vinyl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════════
//  USER ROUTES
// ════════════════════════════════════════════════════════════

// Email validator helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Backend Validation ──
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required." });
    if (name.trim().length < 2)
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    if (!isValidEmail(email))
      return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
      return res.status(400).json({ error: "Password must contain letters and at least one number." });

    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(400).json({ error: "Email already registered." });

    const result = await query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), email.toLowerCase(), password]
    );
    res.json({ message: "Registered successfully", userId: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Backend Validation ──
    if (!email || !password)
      return res.status(400).json({ error: "All fields are required." });
    if (!isValidEmail(email))
      return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });

    const [user] = await query(
      "SELECT id, name, email FROM users WHERE email = ? AND password = ?",
      [email.toLowerCase(), password]
    );
    if (!user) return res.status(401).json({ error: "Invalid email or password." });
    res.json({ message: "Login successful", user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════════
//  ORDER ROUTES
// ════════════════════════════════════════════════════════════

app.post("/api/orders", async (req, res) => {
  try {
    const { userId, items } = req.body;
    if (!userId || !items || !items.length)
      return res.status(400).json({ error: "userId and items required" });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const orderResult = await query(
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [userId, total.toFixed(2)]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await query(
        "INSERT INTO order_items (order_id, vinyl_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.vinylId, item.quantity, item.price]
      );
      await query(
        "UPDATE vinyls SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.vinylId]
      );
    }

    res.json({ message: "Order placed!", orderId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  try {
    const orders = await query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.userId]
    );
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`server connected on port ${PORT}`);
});