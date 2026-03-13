import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { query, pingDb, withTx } from "./db.js";
import {
  hashPassword,
  requireAdmin,
  requireAuth,
  signAccessToken,
  verifyPassword,
} from "./auth.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pingDb();
    res.json({
      ok: true,
      service: "ctf-api",
      db: "ok",
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      service: "ctf-api",
      db: "down",
      error: error.message,
    });
  }
});

// Public routes
app.get("/api/config", (_req, res) => {
  res.json({
    title: process.env.APP_TITLE || "CTF Platform",
    slogan: process.env.APP_SLOGAN || "Everyone starts somewhere",
    customTheme: process.env.APP_THEME || "#539bb8",
  });
});

app.get("/api/game", async (_req, res) => {
  const { rows } = await query(
    "SELECT id, title, description, starts_at, ends_at, is_public FROM games WHERE is_public = TRUE ORDER BY starts_at DESC NULLS LAST, id DESC"
  );
  res.json(rows);
});

app.get("/api/game/recent", async (_req, res) => {
  const { rows } = await query(
    "SELECT id, title, starts_at, ends_at FROM games WHERE is_public = TRUE ORDER BY created_at DESC LIMIT 5"
  );
  res.json(rows);
});

app.get("/api/posts", async (_req, res) => {
  const { rows } = await query(
    "SELECT id, title, body, created_at FROM posts WHERE is_public = TRUE ORDER BY created_at DESC"
  );
  res.json(rows);
});

app.get("/api/posts/latest", async (_req, res) => {
  const { rows } = await query(
    "SELECT id, title, body, created_at FROM posts WHERE is_public = TRUE ORDER BY created_at DESC LIMIT 5"
  );
  res.json(rows);
});

app.get("/api/captcha", (_req, res) => {
  res.json({ provider: "turnstile", enabled: false, challenge: null });
});

// Account routes
app.post("/api/account/register", async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "email, password, displayName are required" });
  }

  const passwordHash = await hashPassword(password);
  try {
    const { rows } = await query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, role",
      [String(email).toLowerCase().trim(), passwordHash, String(displayName).trim()]
    );
    const user = rows[0];
    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return res.status(201).json({ token, user });
  } catch (error) {
    if (String(error.message).includes("users_email_key")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/account/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const { rows } = await query(
    "SELECT id, email, display_name, role, password_hash FROM users WHERE email = $1 LIMIT 1",
    [String(email).toLowerCase().trim()]
  );

  if (!rows[0]) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await verifyPassword(password, rows[0].password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signAccessToken({
    id: rows[0].id,
    email: rows[0].email,
    role: rows[0].role,
  });

  return res.json({
    token,
    user: {
      id: rows[0].id,
      email: rows[0].email,
      display_name: rows[0].display_name,
      role: rows[0].role,
    },
  });
});

app.post("/api/account/logout", requireAuth, (_req, res) => {
  // Stateless JWT logout: client should discard token.
  res.json({ ok: true });
});

app.get("/api/account/profile", requireAuth, async (req, res) => {
  const { rows } = await query(
    "SELECT id, email, display_name, role, is_verified, created_at FROM users WHERE id = $1 LIMIT 1",
    [req.user.sub]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: "Profile not found" });
  }
  return res.json(rows[0]);
});

app.put("/api/account/update", requireAuth, async (req, res) => {
  const { displayName } = req.body || {};
  if (!displayName) {
    return res.status(400).json({ error: "displayName is required" });
  }
  const { rows } = await query(
    "UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name, role, is_verified",
    [String(displayName).trim(), req.user.sub]
  );
  return res.json(rows[0]);
});

app.post("/api/account/changepassword", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "oldPassword and newPassword are required" });
  }
  const { rows } = await query(
    "SELECT password_hash FROM users WHERE id = $1 LIMIT 1",
    [req.user.sub]
  );
  if (!rows[0] || !(await verifyPassword(oldPassword, rows[0].password_hash))) {
    return res.status(401).json({ error: "Invalid current password" });
  }
  const newHash = await hashPassword(newPassword);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.user.sub]);
  return res.json({ ok: true });
});

app.post("/api/account/changeemail", requireAuth, (_req, res) => {
  res.json({ message: "TODO: email change confirmation flow" });
});
app.post("/api/account/verify", (_req, res) => {
  res.json({ message: "TODO: account verify flow" });
});
app.post("/api/account/mailchangeconfirm", (_req, res) => {
  res.json({ message: "TODO: mail change confirm flow" });
});
app.post("/api/account/recovery", (_req, res) => {
  res.json({ message: "TODO: account recovery flow" });
});
app.post("/api/account/passwordreset", (_req, res) => {
  res.json({ message: "TODO: password reset flow" });
});
app.get("/api/account/avatar", requireAuth, (_req, res) => {
  res.json({ url: null });
});

// Team routes
app.get("/api/team", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.name, tm.role, t.created_at
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1
     ORDER BY t.created_at DESC`,
    [req.user.sub]
  );
  res.json(rows);
});

app.post("/api/team", requireAuth, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const team = await withTx(async (tx) => {
      const createRes = await tx.query(
        "INSERT INTO teams (name, captain_user_id) VALUES ($1, $2) RETURNING id, name, captain_user_id, created_at",
        [String(name).trim(), req.user.sub]
      );
      await tx.query(
        "INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'captain')",
        [createRes.rows[0].id, req.user.sub]
      );
      return createRes.rows[0];
    });
    return res.status(201).json(team);
  } catch (error) {
    if (String(error.message).includes("teams_name_key")) {
      return res.status(409).json({ error: "Team name already exists" });
    }
    return res.status(500).json({ error: "Team creation failed" });
  }
});

app.post("/api/team/accept", requireAuth, (_req, res) => {
  res.json({ message: "TODO: team invite acceptance flow" });
});
app.post("/api/team/verify", requireAuth, (_req, res) => {
  res.json({ message: "TODO: team verification flow" });
});

// Token routes
app.get("/api/tokens", requireAuth, async (req, res) => {
  const { rows } = await query(
    "SELECT id, name, created_at, last_used_at FROM user_tokens WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.sub]
  );
  res.json(rows);
});

app.post("/api/tokens", requireAuth, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }
  const raw = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const { rows } = await query(
    "INSERT INTO user_tokens (user_id, name, token_hash) VALUES ($1, $2, $3) RETURNING id, name, created_at",
    [req.user.sub, String(name).trim(), tokenHash]
  );
  res.status(201).json({
    ...rows[0],
    token: `ctf_${raw}`,
  });
});

// Admin routes
app.get("/api/admin/config", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: admin config details" });
});
app.post("/api/admin/config/logo", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: upload logo endpoint" });
});
app.get("/api/admin/files", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: admin files endpoint" });
});
app.get("/api/admin/instances", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: admin instances endpoint" });
});
app.get("/api/admin/logs", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: admin logs endpoint" });
});
app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await query(
    "SELECT id, email, display_name, role, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 200"
  );
  res.json(rows);
});
app.get("/api/admin/users/search", requireAuth, requireAdmin, async (req, res) => {
  const q = `%${String(req.query.q || "").trim()}%`;
  const { rows } = await query(
    "SELECT id, email, display_name, role, is_verified FROM users WHERE email ILIKE $1 OR display_name ILIKE $1 ORDER BY created_at DESC LIMIT 50",
    [q]
  );
  res.json(rows);
});
app.get("/api/admin/teams", requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await query(
    "SELECT id, name, captain_user_id, created_at FROM teams ORDER BY created_at DESC LIMIT 200"
  );
  res.json(rows);
});
app.get("/api/admin/teams/search", requireAuth, requireAdmin, async (req, res) => {
  const q = `%${String(req.query.q || "").trim()}%`;
  const { rows } = await query(
    "SELECT id, name, captain_user_id, created_at FROM teams WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT 50",
    [q]
  );
  res.json(rows);
});
app.get("/api/admin/writeups", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: writeups moderation endpoint" });
});

// Game edit routes
app.get("/api/edit/games", requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await query(
    "SELECT id, title, description, starts_at, ends_at, is_public, created_at FROM games ORDER BY created_at DESC"
  );
  res.json(rows);
});
app.post("/api/edit/games/import", requireAuth, requireAdmin, (_req, res) => {
  res.json({ message: "TODO: game import endpoint" });
});
app.get("/api/edit/posts", requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await query(
    "SELECT id, title, body, is_public, created_at FROM posts ORDER BY created_at DESC"
  );
  res.json(rows);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not implemented yet" });
});

app.listen(port, () => {
  console.log(`CTF API running on http://localhost:${port}`);
});

