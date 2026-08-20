import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params; const body = await request.json(); const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: "추가할 PT 횟수를 입력해 주세요." }, { status: 400 });
  const db = openDatabase();
  try {
    const plan = db.prepare("SELECT id FROM Membership WHERE memberId = ? ORDER BY createdAt DESC LIMIT 1").get(memberId) as { id: string } | undefined;
    if (plan) db.prepare("UPDATE Membership SET ptRemaining = COALESCE(ptRemaining, 0) + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(amount, plan.id);
    else db.prepare("INSERT INTO Membership (id, memberId, ptRemaining) VALUES (lower(hex(randomblob(16))), ?, ?)").run(memberId, amount);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "PT 횟수를 추가하지 못했습니다." }, { status: 500 }); } finally { db.close(); }
}
