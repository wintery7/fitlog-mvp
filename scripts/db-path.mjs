export function getDbPath() {
  return process.env.DATABASE_PATH ?? "prisma/dev.db";
}
