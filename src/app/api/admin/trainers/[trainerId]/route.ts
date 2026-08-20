import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: Promise<{ trainerId: string }> }) {
  const { trainerId } = await params;
  const body = await request.json();
  const loginId = String(body.loginId ?? "").trim();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim() || loginId;
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  const branch = String(body.branch ?? "").trim();
  if (!/^[A-Za-z가-힣]+$/.test(loginId)) return NextResponse.json({ error: "트레이너명(ID)은 한글 또는 영문만 작성할 수 있습니다. 숫자와 공백은 사용할 수 없습니다." }, { status: 400 });
  if (!loginId || !phone || !email || !branch) return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
  const db = openDatabase();
  const trainer = db.prepare("SELECT userId FROM Trainer WHERE id = ?").get(trainerId) as { userId: string } | undefined;
  if (!trainer) { db.close(); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
  const duplicate = db.prepare("SELECT User.id FROM User LEFT JOIN Trainer ON Trainer.userId = User.id WHERE (User.email = ? OR Trainer.phone = ? OR Trainer.email = ?) AND User.id != ? LIMIT 1").get(loginId, phone, email, trainer.userId);
  if (duplicate) { db.close(); return NextResponse.json({ error: "ID, 휴대폰 번호 또는 이메일이 이미 사용 중입니다." }, { status: 409 }); }
  if (password) db.prepare("UPDATE User SET name = ?, email = ?, passwordHash = ? WHERE id = ?").run(name, loginId, password, trainer.userId);
  else db.prepare("UPDATE User SET name = ?, email = ? WHERE id = ?").run(name, loginId, trainer.userId);
  db.prepare("UPDATE Trainer SET phone = ?, email = ?, branch = ? WHERE id = ?").run(phone, email, branch, trainerId);
  db.close();
  return NextResponse.json({ ok: true });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ trainerId: string }> }) {
  const { trainerId } = await params;
  const db = openDatabase();
  try {
    const trainer = db.prepare("SELECT userId FROM Trainer WHERE id = ?").get(trainerId) as { userId: string } | undefined;
    if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // A trainer owns their member records. Delete every dependent record first
    // so that no membership or workout data remains orphaned.
    db.exec("BEGIN");
    db.prepare("DELETE FROM SetRecord WHERE exerciseRecordId IN (SELECT ExerciseRecord.id FROM ExerciseRecord JOIN WorkoutLog ON WorkoutLog.id = ExerciseRecord.workoutLogId WHERE WorkoutLog.memberId IN (SELECT id FROM Member WHERE trainerId = ?))").run(trainerId);
    db.prepare("DELETE FROM ExerciseRecord WHERE workoutLogId IN (SELECT id FROM WorkoutLog WHERE memberId IN (SELECT id FROM Member WHERE trainerId = ?))").run(trainerId);
    db.prepare("DELETE FROM WorkoutLog WHERE memberId IN (SELECT id FROM Member WHERE trainerId = ?)").run(trainerId);
    db.prepare("DELETE FROM Membership WHERE memberId IN (SELECT id FROM Member WHERE trainerId = ?)").run(trainerId);
    const deletedMembers = db.prepare("DELETE FROM Member WHERE trainerId = ?").run(trainerId).changes;
    db.prepare("DELETE FROM Trainer WHERE id = ?").run(trainerId);
    db.prepare("DELETE FROM User WHERE id = ?").run(trainer.userId);
    db.exec("COMMIT");
    return NextResponse.json({ ok: true, deletedMembers });
  } catch {
    try { db.exec("ROLLBACK"); } catch {}
    return NextResponse.json({ error: "트레이너와 배정 회원을 삭제하지 못했습니다." }, { status: 500 });
  } finally {
    db.close();
  }
}
