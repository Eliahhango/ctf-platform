import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ctf-api", time: new Date().toISOString() });
});

// Public routes
app.get("/api/config", (_req, res) => res.json({ message: "TODO: config" }));
app.get("/api/game", (_req, res) => res.json({ message: "TODO: games list" }));
app.get("/api/game/recent", (_req, res) => res.json({ message: "TODO: recent games" }));
app.get("/api/posts", (_req, res) => res.json({ message: "TODO: posts list" }));
app.get("/api/posts/latest", (_req, res) => res.json({ message: "TODO: latest posts" }));
app.get("/api/captcha", (_req, res) => res.json({ message: "TODO: captcha challenge" }));

// Account routes
app.post("/api/account/login", (_req, res) => res.json({ message: "TODO: login" }));
app.post("/api/account/register", (_req, res) => res.json({ message: "TODO: register" }));
app.post("/api/account/recovery", (_req, res) => res.json({ message: "TODO: account recovery" }));
app.post("/api/account/passwordreset", (_req, res) => res.json({ message: "TODO: password reset" }));
app.post("/api/account/logout", (_req, res) => res.json({ message: "TODO: logout" }));
app.get("/api/account/profile", (_req, res) => res.json({ message: "TODO: get profile" }));
app.put("/api/account/update", (_req, res) => res.json({ message: "TODO: update profile" }));
app.post("/api/account/changepassword", (_req, res) => res.json({ message: "TODO: change password" }));
app.post("/api/account/changeemail", (_req, res) => res.json({ message: "TODO: change email" }));
app.post("/api/account/verify", (_req, res) => res.json({ message: "TODO: verify account" }));
app.post("/api/account/mailchangeconfirm", (_req, res) => res.json({ message: "TODO: confirm mail change" }));
app.get("/api/account/avatar", (_req, res) => res.json({ message: "TODO: avatar metadata" }));

// Team routes
app.get("/api/team", (_req, res) => res.json({ message: "TODO: my team" }));
app.post("/api/team/accept", (_req, res) => res.json({ message: "TODO: accept invite" }));
app.post("/api/team/verify", (_req, res) => res.json({ message: "TODO: verify team" }));

// Token routes
app.get("/api/tokens", (_req, res) => res.json({ message: "TODO: token list" }));
app.post("/api/tokens", (_req, res) => res.json({ message: "TODO: create token" }));

// Admin routes
app.get("/api/admin/config", (_req, res) => res.json({ message: "TODO: admin config" }));
app.post("/api/admin/config/logo", (_req, res) => res.json({ message: "TODO: upload logo" }));
app.get("/api/admin/files", (_req, res) => res.json({ message: "TODO: admin files" }));
app.get("/api/admin/instances", (_req, res) => res.json({ message: "TODO: instances" }));
app.get("/api/admin/logs", (_req, res) => res.json({ message: "TODO: logs" }));
app.get("/api/admin/users", (_req, res) => res.json({ message: "TODO: users" }));
app.get("/api/admin/users/search", (_req, res) => res.json({ message: "TODO: user search" }));
app.get("/api/admin/teams", (_req, res) => res.json({ message: "TODO: teams" }));
app.get("/api/admin/teams/search", (_req, res) => res.json({ message: "TODO: team search" }));
app.get("/api/admin/writeups", (_req, res) => res.json({ message: "TODO: writeups" }));

// Game edit routes
app.get("/api/edit/games", (_req, res) => res.json({ message: "TODO: editable games" }));
app.post("/api/edit/games/import", (_req, res) => res.json({ message: "TODO: import game" }));
app.get("/api/edit/posts", (_req, res) => res.json({ message: "TODO: editable posts" }));

app.use((_req, res) => {
  res.status(404).json({ error: "Route not implemented yet" });
});

app.listen(port, () => {
  console.log(`CTF API running on http://localhost:${port}`);
});