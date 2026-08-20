import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getDbPath } from "./db-path.mjs";

const dbPath = getDbPath();
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
const existing = db.prepare("SELECT id FROM User WHERE email = ?").get("admin@fitlog.local");
if (!existing) db.prepare("INSERT INTO User (id,email,name,role,passwordHash) VALUES (?,?,?,?,?)").run(randomUUID(), "admin@fitlog.local", "admin", "ADMIN", "1234");
db.close();
console.log("SQLite administrator seeded.");
