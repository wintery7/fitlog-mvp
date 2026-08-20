import { VoiceWorkoutRecorder } from "@/components/voice-workout-recorder";
const t = { title: "\uC74C\uC131 \uC6B4\uB3D9\uC77C\uC9C0", subtitle: "\uCD94\uCD9C\uB41C \uBAA8\uB4E0 \uAC12\uC744 \uD655\uC778\uD558\uACE0 \uC800\uC7A5\uD558\uC138\uC694." };
export default function NewWorkoutPage() { return <main className="page-shell"><header className="page-header"><p className="eyebrow">FITLOG / WORKOUT</p><h1>{t.title}</h1><p>{t.subtitle}</p></header><VoiceWorkoutRecorder /></main>; }
