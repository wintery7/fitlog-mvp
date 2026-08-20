import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getDbPath } from "./db-path.mjs";

const dbPath = getDbPath();
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
CREATE TABLE IF NOT EXISTS User (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'TRAINER', passwordHash TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS Trainer (id TEXT PRIMARY KEY, userId TEXT UNIQUE NOT NULL, phone TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS Member (id TEXT PRIMARY KEY, memberNumber TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT UNIQUE, birthDate DATETIME, gender TEXT, registeredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, status TEXT NOT NULL DEFAULT 'ACTIVE', memo TEXT, trainerId TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS Membership (id TEXT PRIMARY KEY, memberId TEXT NOT NULL, membershipFrom DATETIME, membershipTo DATETIME, ptFrom DATETIME, ptTo DATETIME, ptRemaining INTEGER, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS Exercise (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS ExerciseAlias (id TEXT PRIMARY KEY, alias TEXT UNIQUE NOT NULL, exerciseId TEXT NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS WorkoutLog (id TEXT PRIMARY KEY, memberId TEXT NOT NULL, trainerId TEXT, workoutDate DATETIME NOT NULL, transcript TEXT, generalNote TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS ExerciseRecord (id TEXT PRIMARY KEY, workoutLogId TEXT NOT NULL, exerciseId TEXT, exerciseName TEXT NOT NULL, note TEXT, "order" INTEGER NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS SetRecord (id TEXT PRIMARY KEY, exerciseRecordId TEXT NOT NULL, setNumber INTEGER NOT NULL, weight REAL, repetitions INTEGER, duration INTEGER, distance REAL, note TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS Member_name_idx ON Member(name);
CREATE INDEX IF NOT EXISTS Member_trainerId_idx ON Member(trainerId);
CREATE INDEX IF NOT EXISTS WorkoutLog_memberId_workoutDate_idx ON WorkoutLog(memberId, workoutDate);
`);
const memberColumns = db.prepare("PRAGMA table_info(Member)").all().map((column) => column.name);
if (!memberColumns.includes("passwordHash")) db.exec("ALTER TABLE Member ADD COLUMN passwordHash TEXT");
if (!memberColumns.includes("email")) db.exec("ALTER TABLE Member ADD COLUMN email TEXT");
const exerciseColumns = db.prepare("PRAGMA table_info(Exercise)").all().map((column) => column.name);
if (!exerciseColumns.includes("category")) db.exec("ALTER TABLE Exercise ADD COLUMN category TEXT NOT NULL DEFAULT '기타'");
if (!exerciseColumns.includes("instructions")) db.exec("ALTER TABLE Exercise ADD COLUMN instructions TEXT");
if (!exerciseColumns.includes("mediaUrl")) db.exec("ALTER TABLE Exercise ADD COLUMN mediaUrl TEXT");
const trainerColumns = db.prepare("PRAGMA table_info(Trainer)").all().map((column) => column.name);
if (!trainerColumns.includes("email")) db.exec("ALTER TABLE Trainer ADD COLUMN email TEXT");
if (!trainerColumns.includes("branch")) db.exec("ALTER TABLE Trainer ADD COLUMN branch TEXT");
if (!trainerColumns.includes("approved")) db.exec("ALTER TABLE Trainer ADD COLUMN approved INTEGER NOT NULL DEFAULT 0");

// Earlier local databases enforced global uniqueness for member ID, phone and email.
// A member's name(ID) can repeat; phone/email only need to be unique within its trainer.
const memberSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'Member'").get()?.sql ?? "";
if (memberSql.includes("memberNumber TEXT UNIQUE") || memberSql.includes("phone TEXT UNIQUE")) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE Member_migrated (
      id TEXT PRIMARY KEY,
      memberNumber TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      birthDate DATETIME,
      gender TEXT,
      registeredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      memo TEXT,
      trainerId TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      passwordHash TEXT,
      email TEXT
    );
    INSERT INTO Member_migrated (id, memberNumber, name, phone, birthDate, gender, registeredAt, status, memo, trainerId, createdAt, updatedAt, passwordHash, email)
      SELECT id, memberNumber, name, phone, birthDate, gender, registeredAt, status, memo, trainerId, createdAt, updatedAt, passwordHash, email FROM Member;
    DROP TABLE Member;
    ALTER TABLE Member_migrated RENAME TO Member;
    PRAGMA foreign_keys = ON;
  `);
}
db.exec(`
  DROP INDEX IF EXISTS Member_email_key;
  CREATE INDEX IF NOT EXISTS Member_name_idx ON Member(name);
  CREATE INDEX IF NOT EXISTS Member_trainerId_idx ON Member(trainerId);
  CREATE UNIQUE INDEX IF NOT EXISTS Member_trainer_phone_key ON Member(trainerId, phone) WHERE phone IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS Member_trainer_email_key ON Member(trainerId, email) WHERE email IS NOT NULL;
`);
db.close();
console.log("FitLog SQLite tables initialized.");
