import { DatabaseSync } from "node:sqlite";

export function getDbPath() {
  return process.env.DATABASE_PATH ?? "prisma/dev.db";
}

export function openDatabase() {
  return new DatabaseSync(getDbPath());
}
