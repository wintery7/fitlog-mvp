import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ loginId: z.string().regex(/^[A-Za-z가-힣]+$/, "트레이너명(ID)은 한글 또는 영문만 작성할 수 있습니다. 숫자와 공백은 사용할 수 없습니다."), password: z.string().min(4), name: z.string().regex(/^[A-Za-z가-힣]+$/), phone: z.string().min(1), email: z.string().email(), branch: z.string().min(1) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "트레이너 정보를 확인해 주세요." }, { status: 400 });
  const data = parsed.data;
  const duplicate = await prisma.user.findFirst({ where: { OR: [{ email: data.loginId }, { email: data.email }] } });
  if (duplicate) return NextResponse.json({ error: "Duplicate ID or email." }, { status: 409 });
  const user = await prisma.user.create({ data: { email: data.loginId, name: data.name, role: "TRAINER", passwordHash: data.password, trainer: { create: { phone: data.phone, email: data.email, branch: data.branch, approved: false } } }, include: { trainer: true } });
  return NextResponse.json({ id: user.trainer?.id }, { status: 201 });
}
