import { MemberManager } from "@/components/member-manager";
import { Suspense } from "react";
const t = { title: "\uD68C\uC6D0 \uAD00\uB9AC", subtitle: "\uD68C\uC6D0\uC744 \uB4F1\uB85D\uD558\uACE0 \uD68C\uC6D0\uAD8C \uC77C\uC815\uACFC \uAE30\uB85D\uC744 \uBE60\uB974\uAC8C \uD655\uC778\uD558\uC138\uC694." };
export default function MembersPage() { return <main className="page-shell"><header className="page-header"><p className="eyebrow">FITLOG / MEMBERS</p><h1>{t.title}</h1><p>{t.subtitle}</p></header><Suspense fallback={<p className="hint">불러오는 중...</p>}><MemberManager /></Suspense></main>; }
