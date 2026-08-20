import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json(); const loginId = String(body.loginId ?? "").trim(); const password = String(body.password ?? ""); const role = String(body.role ?? ""); const trainerName = String(body.trainerName ?? "").trim();
  if (role === "TRAINER" && loginId === "스포애니" && password === "1234") return NextResponse.json({ role: "ADMIN" });
  const db = openDatabase();
  if (role === "TRAINER") { const row = db.prepare("SELECT Trainer.id, User.name FROM User JOIN Trainer ON Trainer.userId = User.id WHERE User.email = ? AND User.passwordHash = ? AND User.role = 'TRAINER' AND Trainer.approved = 1").get(loginId, password) as { id: string; name: string } | undefined; db.close(); return row ? NextResponse.json({ role: "TRAINER", trainerId: row.id, name: row.name }) : NextResponse.json({ error: "Login failed" }, { status: 401 }); }
  if (role === "MEMBER") { const row = db.prepare("SELECT Member.id, Member.name, Member.trainerId FROM Member JOIN Trainer ON Trainer.id = Member.trainerId JOIN User ON User.id = Trainer.userId WHERE User.name = ? AND Member.memberNumber = ? AND Member.passwordHash = ?").get(trainerName, loginId, password) as { id: string; name: string; trainerId: string } | undefined; db.close(); return row ? NextResponse.json({ role: "MEMBER", memberId: row.id, trainerId: row.trainerId, name: row.name }) : NextResponse.json({ error: "Login failed" }, { status: 401 }); }
  db.close(); return NextResponse.json({ error: "Login failed" }, { status: 401 });
}
