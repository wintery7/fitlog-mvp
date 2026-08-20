import { NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
export const runtime = "nodejs";
export async function POST(_: Request, { params }: { params: Promise<{ trainerId: string }> }) { const { trainerId } = await params; const db = openDatabase(); db.prepare("UPDATE Trainer SET approved = 1 WHERE id = ?").run(trainerId); db.close(); return NextResponse.json({ ok: true }); }
