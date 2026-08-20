import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/lib/sqlite";

export const runtime = "nodejs";

function removeDetails(db: DatabaseSync, logId: string) {
  db.prepare("DELETE FROM SetRecord WHERE exerciseRecordId IN (SELECT id FROM ExerciseRecord WHERE workoutLogId = ?)").run(logId);
  db.prepare("DELETE FROM ExerciseRecord WHERE workoutLogId = ?").run(logId);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params; const body = await request.json(); const date = String(body.date ?? "").trim(); const title = String(body.title ?? "").trim(); const items = Array.isArray(body.items) ? body.items : [];
  if (!date || !title) return NextResponse.json({ error: "운동일자와 운동제목을 입력해 주세요." }, { status: 400 });
  const db = openDatabase();
  try {
    if (!db.prepare("SELECT id FROM WorkoutLog WHERE id = ?").get(logId)) return NextResponse.json({ error: "운동일지를 찾을 수 없습니다." }, { status: 404 });
    db.exec("BEGIN"); removeDetails(db, logId); db.prepare("UPDATE WorkoutLog SET workoutDate = ?, generalNote = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(date, title, logId);
    items.filter((item: { name?: unknown }) => String(item.name ?? "").trim()).forEach((item: { name: unknown; kg?: unknown; reps?: unknown; sets?: unknown }, index: number) => { const recordId = randomUUID(); db.prepare("INSERT INTO ExerciseRecord (id, workoutLogId, exerciseName, \"order\") VALUES (?, ?, ?, ?)").run(recordId, logId, String(item.name).trim(), index + 1); db.prepare("INSERT INTO SetRecord (id, exerciseRecordId, setNumber, weight, repetitions, note) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), recordId, 1, Number(item.kg) || null, Number(item.reps) || null, String(item.sets ?? "").trim() || null); });
    db.exec("COMMIT"); return NextResponse.json({ ok: true });
  } catch { try { db.exec("ROLLBACK"); } catch {} return NextResponse.json({ error: "운동일지를 수정하지 못했습니다." }, { status: 500 }); } finally { db.close(); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params; const db = openDatabase();
  try { db.exec("BEGIN"); removeDetails(db, logId); const result = db.prepare("DELETE FROM WorkoutLog WHERE id = ?").run(logId); db.exec("COMMIT"); return result.changes ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "운동일지를 찾을 수 없습니다." }, { status: 404 }); } catch { try { db.exec("ROLLBACK"); } catch {} return NextResponse.json({ error: "운동일지를 삭제하지 못했습니다." }, { status: 500 }); } finally { db.close(); }
}
