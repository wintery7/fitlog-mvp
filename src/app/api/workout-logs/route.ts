import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/lib/sqlite";

export const runtime = "nodejs";
type WorkoutItem = { name?: unknown; kg?: unknown; reps?: unknown; sets?: unknown };

function getLogs(db: DatabaseSync, memberId: string) {
  const logs = db.prepare("SELECT id, workoutDate, generalNote FROM WorkoutLog WHERE memberId = ? ORDER BY workoutDate DESC, createdAt DESC").all(memberId) as Array<{ id: string; workoutDate: string; generalNote: string | null }>;
  return logs.map((log) => {
    const grouped = new Map<string, { name: string; sets: { kg: number | null; reps: number | null; sets: string }[] }>();
    const records = db.prepare("SELECT id, exerciseName FROM ExerciseRecord WHERE workoutLogId = ? ORDER BY \"order\"").all(log.id) as Array<{ id: string; exerciseName: string }>;
    records.forEach((record) => {
      const item = grouped.get(record.exerciseName) ?? { name: record.exerciseName, sets: [] };
      item.sets.push(...(db.prepare("SELECT weight, repetitions, note FROM SetRecord WHERE exerciseRecordId = ? ORDER BY setNumber").all(record.id) as Array<{ weight: number | null; repetitions: number | null; note: string | null }>).map((set) => ({ kg: set.weight, reps: set.repetitions, sets: set.note || "" })));
      grouped.set(record.exerciseName, item);
    });
    return { id: log.id, date: log.workoutDate, title: log.generalNote || "운동일지", items: [...grouped.values()] };
  });
}

export async function GET(request: Request) {
  const memberId = new URL(request.url).searchParams.get("memberId")?.trim() || "";
  if (!memberId) return NextResponse.json({ error: "회원 정보가 필요합니다." }, { status: 400 });
  const db = openDatabase();
  try { return NextResponse.json(getLogs(db, memberId)); } finally { db.close(); }
}

export async function POST(request: Request) {
  const body = await request.json(); const memberId = String(body.memberId ?? "").trim(); const date = String(body.date ?? body.workoutDate ?? "").trim(); const title = String(body.title ?? body.generalNote ?? "").trim(); const items: WorkoutItem[] = Array.isArray(body.items) ? body.items : [];
  if (!memberId || !date || !title) return NextResponse.json({ error: "운동일자와 운동제목을 입력해 주세요." }, { status: 400 });
  const db = openDatabase();
  try {
    if (!db.prepare("SELECT id FROM Member WHERE id = ?").get(memberId)) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    const id = randomUUID(); db.exec("BEGIN");
    db.prepare("INSERT INTO WorkoutLog (id, memberId, trainerId, workoutDate, generalNote) VALUES (?, ?, ?, ?, ?)").run(id, memberId, String(body.trainerId ?? "").trim() || null, date, title);
    items.filter((item) => String(item.name ?? "").trim()).forEach((item, index) => { const recordId = randomUUID(); db.prepare("INSERT INTO ExerciseRecord (id, workoutLogId, exerciseName, \"order\") VALUES (?, ?, ?, ?)").run(recordId, id, String(item.name).trim(), index + 1); db.prepare("INSERT INTO SetRecord (id, exerciseRecordId, setNumber, weight, repetitions, note) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), recordId, 1, Number(item.kg) || null, Number(item.reps) || null, String(item.sets ?? "").trim() || null); });
    db.exec("COMMIT"); return NextResponse.json({ id }, { status: 201 });
  } catch { try { db.exec("ROLLBACK"); } catch {} return NextResponse.json({ error: "운동일지를 저장하지 못했습니다." }, { status: 500 }); } finally { db.close(); }
}
