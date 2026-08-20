import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const db = openDatabase();
  const member = db.prepare("SELECT Member.id, Member.name, Membership.ptRemaining, Membership.membershipFrom, Membership.membershipTo, (SELECT COUNT(*) FROM WorkoutLog WHERE WorkoutLog.memberId = Member.id) AS logCount FROM Member LEFT JOIN Membership ON Membership.id = (SELECT id FROM Membership WHERE memberId = Member.id ORDER BY createdAt DESC LIMIT 1) WHERE Member.id = ?").get(memberId);
  db.close();
  return member ? NextResponse.json(member) : NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const body = await request.json();
  const memberNumber = String(body.memberNumber ?? "").trim();
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim() || null;
  const memo = String(body.memo ?? "").trim() || null;
  const password = String(body.password ?? "");
  const email = String(body.email ?? "").trim() || null;
  const membershipFrom = String(body.membershipFrom ?? "").trim() || null;
  const membershipTo = String(body.membershipTo ?? "").trim() || null;
  const ptRemaining = body.ptRemaining === null || body.ptRemaining === "" || body.ptRemaining === undefined ? null : Number(body.ptRemaining);
  if (!/^[A-Za-z가-힣]+$/.test(memberNumber) || !/^[A-Za-z가-힣]+$/.test(name)) return NextResponse.json({ error: "회원명(ID)은 한글 또는 영문만 작성할 수 있습니다. 숫자와 공백은 사용할 수 없습니다." }, { status: 400 });
  if (!memberNumber || !name || (password && !/^\d{4}$/.test(password)) || (ptRemaining !== null && (!Number.isInteger(ptRemaining) || ptRemaining < 0))) return NextResponse.json({ error: "회원 정보를 확인해 주세요." }, { status: 400 });
  const db = openDatabase();
  try {
    const current = db.prepare("SELECT id, trainerId FROM Member WHERE id = ?").get(memberId) as { id: string; trainerId: string | null } | undefined;
    if (!current) { db.close(); return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 }); }
    const duplicate = db.prepare("SELECT id FROM Member WHERE trainerId IS ? AND id != ? AND ((? IS NOT NULL AND phone = ?) OR (? IS NOT NULL AND email = ?))").get(current.trainerId, memberId, phone, phone, email, email);
    if (duplicate) { db.close(); return NextResponse.json({ error: "현재 등록된 회원과 휴대폰 번호 또는 이메일이 중복되어 수정할 수 없습니다." }, { status: 409 }); }
    if (password) db.prepare("UPDATE Member SET memberNumber = ?, name = ?, passwordHash = ?, phone = ?, email = ?, memo = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(memberNumber, name, password, phone, email, memo, memberId);
    else db.prepare("UPDATE Member SET memberNumber = ?, name = ?, phone = ?, email = ?, memo = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(memberNumber, name, phone, email, memo, memberId);
    const latest = db.prepare("SELECT id FROM Membership WHERE memberId = ? ORDER BY createdAt DESC LIMIT 1").get(memberId) as { id: string } | undefined;
    if (latest) db.prepare("UPDATE Membership SET membershipFrom = ?, membershipTo = ?, ptRemaining = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(membershipFrom, membershipTo, ptRemaining, latest.id);
    else if (membershipFrom || membershipTo || ptRemaining !== null) db.prepare("INSERT INTO Membership (id, memberId, membershipFrom, membershipTo, ptRemaining) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), memberId, membershipFrom, membershipTo, ptRemaining);
    db.close();
    return NextResponse.json({ ok: true });
  } catch { db.close(); return NextResponse.json({ error: "회원 정보를 수정하지 못했습니다." }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const db = openDatabase();
  try {
    db.exec("BEGIN");
    db.prepare("DELETE FROM SetRecord WHERE exerciseRecordId IN (SELECT ExerciseRecord.id FROM ExerciseRecord JOIN WorkoutLog ON WorkoutLog.id = ExerciseRecord.workoutLogId WHERE WorkoutLog.memberId = ?)").run(memberId);
    db.prepare("DELETE FROM ExerciseRecord WHERE workoutLogId IN (SELECT id FROM WorkoutLog WHERE memberId = ?)").run(memberId);
    db.prepare("DELETE FROM Membership WHERE memberId = ?").run(memberId);
    db.prepare("DELETE FROM WorkoutLog WHERE memberId = ?").run(memberId);
    const result = db.prepare("DELETE FROM Member WHERE id = ?").run(memberId);
    db.exec("COMMIT");
    db.close();
    return result.changes ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  } catch { try { db.exec("ROLLBACK"); } catch {} db.close(); return NextResponse.json({ error: "회원을 삭제하지 못했습니다." }, { status: 500 }); }
}
