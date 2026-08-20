import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const trainerId = params.get("trainerId")?.trim() ?? "";
  const db = openDatabase();
  const filters: string[] = [];
  const values: string[] = [];
  if (trainerId) { filters.push("Member.trainerId = ?"); values.push(trainerId); }
  if (query) { filters.push("(Member.name LIKE ? OR Member.phone LIKE ? OR Member.email LIKE ? OR Member.memberNumber LIKE ?)"); values.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`); }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT Member.id, Member.memberNumber, Member.name, Member.phone, Member.email, Member.memo, Member.status, Membership.membershipFrom, Membership.membershipTo, Membership.ptRemaining, (SELECT COUNT(*) FROM WorkoutLog WHERE WorkoutLog.memberId = Member.id) AS workoutLogCount FROM Member LEFT JOIN Membership ON Membership.id = (SELECT id FROM Membership WHERE memberId = Member.id ORDER BY createdAt DESC LIMIT 1) ${where} ORDER BY Member.createdAt DESC LIMIT 50`).all(...values) as Array<Record<string, unknown>>;
  db.close();
  return NextResponse.json(rows.map((member) => { const total = typeof member.ptRemaining === "number" ? member.ptRemaining : null; const logs = Number(member.workoutLogCount ?? 0); const remaining = total === null ? null : Math.max(0, total - logs); return { ...member, ptTotal: total, ptRemaining: remaining, memberships: member.membershipFrom !== null || member.membershipTo !== null || total !== null ? [{ membershipFrom: member.membershipFrom, membershipTo: member.membershipTo, ptTotal: total, ptRemaining: remaining }] : [] }; }));
}

export async function POST(request: Request) {
  const body = await request.json();
  const memberNumber = String(body.memberNumber ?? "").trim();
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim() || null;
  const memo = String(body.memo ?? "").trim() || null;
  const password = String(body.password ?? "");
  const email = String(body.email ?? "").trim() || null;
  const trainerId = String(body.trainerId ?? "").trim() || null;
  const membershipFrom = String(body.membershipFrom ?? "").trim() || null;
  const membershipTo = String(body.membershipTo ?? "").trim() || null;
  const ptRemaining = body.ptRemaining === null || body.ptRemaining === "" || body.ptRemaining === undefined ? null : Number(body.ptRemaining);
  if (!/^[A-Za-z가-힣]+$/.test(memberNumber) || !/^[A-Za-z가-힣]+$/.test(name)) return NextResponse.json({ error: "회원명(ID)은 한글 또는 영문만 작성할 수 있습니다. 숫자와 공백은 사용할 수 없습니다." }, { status: 400 });
  if (!memberNumber || !name || !/^\d{4}$/.test(password) || (ptRemaining !== null && (!Number.isInteger(ptRemaining) || ptRemaining < 0))) return NextResponse.json({ error: "회원 ID, 숫자 4자리 비밀번호, PT 횟수를 확인해 주세요." }, { status: 400 });

  const db = openDatabase();
  try {
    const duplicate = db.prepare("SELECT id FROM Member WHERE trainerId IS ? AND ((? IS NOT NULL AND phone = ?) OR (? IS NOT NULL AND email = ?))").get(trainerId, phone, phone, email, email);
    if (duplicate) { db.close(); return NextResponse.json({ error: "현재 등록된 회원과 휴대폰 번호 또는 이메일이 중복되어 회원을 생성할 수 없습니다." }, { status: 409 }); }
    if (trainerId && !db.prepare("SELECT id FROM Trainer WHERE id = ?").get(trainerId)) { db.close(); return NextResponse.json({ error: "담당 트레이너를 찾을 수 없습니다." }, { status: 404 }); }
    const memberId = randomUUID();
    db.prepare("INSERT INTO Member (id, memberNumber, name, passwordHash, phone, email, memo, trainerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(memberId, memberNumber, name, password, phone, email, memo, trainerId);
    if (membershipFrom || membershipTo || ptRemaining !== null) db.prepare("INSERT INTO Membership (id, memberId, membershipFrom, membershipTo, ptRemaining) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), memberId, membershipFrom, membershipTo, ptRemaining);
    db.close();
    return NextResponse.json({ id: memberId, memberNumber, name, phone, memberships: ptRemaining === null ? [] : [{ membershipTo, ptRemaining }] }, { status: 201 });
  } catch {
    db.close();
    return NextResponse.json({ error: "회원 등록에 실패했습니다." }, { status: 500 });
  }
}
