import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "./db.js";

async function run() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const sqlPath = path.resolve(here, "../../../infra/sql/001_init.sql");
  const sql = await fs.readFile(sqlPath, "utf8");
  await query(sql);
  console.log("Migration applied:", sqlPath);
  process.exit(0);
}

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});

