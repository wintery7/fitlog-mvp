import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
export const runtime = "nodejs";

export async function GET() { const db = openDatabase(); const rows = db.prepare("SELECT Trainer.id, Trainer.phone, Trainer.email, Trainer.branch, Trainer.approved, User.name, User.email AS loginId, COUNT(Member.id) AS memberCount FROM Trainer JOIN User ON User.id = Trainer.userId LEFT JOIN Member ON Member.trainerId = Trainer.id GROUP BY Trainer.id, Trainer.phone, Trainer.email, Trainer.branch, Trainer.approved, User.name, User.email ORDER BY User.name").all(); db.close(); return NextResponse.json(rows); }

export async function POST(request: Request) {
  const body = await request.json(); const loginId = String(body.loginId ?? "").trim(); const password = String(body.password ?? ""); const name = String(body.name ?? "").trim() || loginId; const phone = String(body.phone ?? "").trim(); const email = String(body.email ?? "").trim(); const branch = String(body.branch ?? "").trim();
  if (!/^[A-Za-z가-힣]+$/.test(loginId)) return NextResponse.json({ error: "트레이너명(ID)은 한글 또는 영문만 작성할 수 있습니다. 숫자와 공백은 사용할 수 없습니다." }, { status: 400 });
  if (!loginId || !password || !phone || !email || !branch) return NextResponse.json({ error: "모든 정보를 입력해 주세요." }, { status: 400 });
  const db = openDatabase();
  try {
    const duplicate = db.prepare("SELECT User.id FROM User LEFT JOIN Trainer ON Trainer.userId = User.id WHERE User.email = ? OR Trainer.phone = ? OR Trainer.email = ? LIMIT 1").get(loginId, phone, email);
    if (duplicate) { db.close(); return NextResponse.json({ error: "ID, 휴대폰 번호 또는 이메일이 이미 사용 중입니다." }, { status: 409 }); }
    const userId = randomUUID(); const trainerId = randomUUID();
    db.prepare("INSERT INTO User (id, email, name, role, passwordHash) VALUES (?, ?, ?, 'TRAINER', ?)").run(userId, loginId, name, password);
    db.prepare("INSERT INTO Trainer (id, userId, phone, email, branch, approved) VALUES (?, ?, ?, ?, ?, 1)").run(trainerId, userId, phone, email, branch);
    db.close(); return NextResponse.json({ id: trainerId }, { status: 201 });
  } catch { db.close(); return NextResponse.json({ error: "트레이너 등록에 실패했습니다." }, { status: 500 }); }
}
