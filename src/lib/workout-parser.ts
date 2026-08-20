export type ParsedSet = { setNumber: number; weight: number | null; repetitions: number | null };
export type ParsedExercise = { name: string; sets: ParsedSet[] };
export type WorkoutParseResult = { exercises: ParsedExercise[]; uncertainFields: string[] };

const DEADLIFT = "\uB370\uB4DC\uB9AC\uD504\uD2B8";
const SQUAT = "\uC2A4\uCFE0\uD2B8";
const BENCH_PRESS = "\uBCA4\uCE58\uD504\uB808\uC2A4";
const LAT_PULLDOWN = "\uB7AB\uD480\uB2E4\uC6B4";
const BARBELL_ROW = "\uBC14\uBCA8\uB85C\uC6B0";
const OVERHEAD_PRESS = "\uC624\uBC84\uD5E4\uB4DC\uD504\uB808\uC2A4";
const aliases: Record<string, string> = {
  [DEADLIFT]: DEADLIFT, ["\uB370\uB4DC"]: DEADLIFT, deadlift: DEADLIFT, dead: DEADLIFT,
  [SQUAT]: SQUAT, squat: SQUAT,
  [BENCH_PRESS]: BENCH_PRESS, ["\uBCA4\uCE58"]: BENCH_PRESS, bench: BENCH_PRESS,
  [LAT_PULLDOWN]: LAT_PULLDOWN, "lat pulldown": LAT_PULLDOWN,
  [BARBELL_ROW]: BARBELL_ROW, [OVERHEAD_PRESS]: OVERHEAD_PRESS,
};
function addSets(target: ParsedSet[], count: number, weight: number | null, repetitions: number | null) {
  for (let index = 0; index < count; index += 1) target.push({ setNumber: target.length + 1, weight, repetitions });
}
/** Keeps source facts only. Missing measurements always remain null. */
export function parseWorkoutTranscript(transcript: string): WorkoutParseResult {
  const lower = transcript.toLowerCase().replace(/\s+/g, " ").trim();
  const name = Object.entries(aliases).find(([alias]) => lower.includes(alias))?.[1];
  if (!name) return { exercises: [], uncertainFields: ["\uC6B4\uB3D9 \uC885\uBAA9\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."] };
  const weightUnit = "(?:kg|\uD0AC\uB85C|\uD0A4\uB85C)?";
  const particle = "(?:\uB85C|\uC73C\uB85C)?";
  const reps = "(?:\uD68C|\uBC88|\uAC1C)";
  const setWord = "\uC138\uD2B8";
  const repeated = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${weightUnit}\\s*${particle}\\s*(\\d+)\\s*${reps}\\s*(\\d+)\\s*${setWord}`, "g");
  const individual = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${weightUnit}\\s*${particle}\\s*(\\d+)\\s*${reps}(?!\\s*\\d+\\s*${setWord})`, "g");
  const sets: ParsedSet[] = [];
  for (const match of lower.matchAll(repeated)) addSets(sets, Number(match[3]), Number(match[1]), Number(match[2]));
  for (const match of lower.matchAll(individual)) addSets(sets, 1, Number(match[1]), Number(match[2]));
  if (sets.length === 0) {
    const repetition = lower.match(new RegExp(`(\\d+)\\s*${reps}`));
    const count = lower.match(new RegExp(`(\\d+)\\s*${setWord}`));
    if (repetition) addSets(sets, Number(count?.[1] ?? 1), null, Number(repetition[1]));
  }
  const uncertainFields = sets.length === 0 ? ["\uC138\uD2B8 \uC0C1\uC138 \uC815\uBCF4\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."] : sets.some((set) => set.weight === null) ? ["\uC6D0\uBB38\uC5D0 \uC911\uB7C9\uC774 \uC5C6\uC5B4 \uBE44\uC6CC \uB450\uC5C8\uC2B5\uB2C8\uB2E4."] : [];
  return { exercises: [{ name, sets }], uncertainFields };
}
