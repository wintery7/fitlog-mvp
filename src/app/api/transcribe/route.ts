import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "음성 파일 변환용 API 키가 설정되지 않았습니다." }, { status: 503 });
  const input = await request.formData(); const file = input.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "녹음 파일을 선택해 주세요." }, { status: 400 });
  const body = new FormData(); body.append("model", "whisper-1"); body.append("language", "ko"); body.append("file", file, file.name || "recording.webm");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body });
  if (!response.ok) return NextResponse.json({ error: "녹음 파일을 텍스트로 변환하지 못했습니다." }, { status: 502 });
  const result = await response.json() as { text?: string };
  return NextResponse.json({ text: result.text ?? "" });
}
