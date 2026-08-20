import { describe, expect, it } from "vitest";
import { parseWorkoutTranscript } from "./workout-parser";
const deadlift = "\uB370\uB4DC\uB9AC\uD504\uD2B8";
const squat = "\uC2A4\uCFE0\uD2B8";
const kilo = "\uD0A4\uB85C";
const rep = "\uD68C";
const set = "\uC138\uD2B8";
describe("parseWorkoutTranscript", () => {
  it("expands repeated sets", () => { const parsed = parseWorkoutTranscript(`${deadlift} 100${kilo} 10${rep} 3${set}`); expect(parsed.exercises[0]?.sets).toHaveLength(3); expect(parsed.exercises[0]?.sets[0]).toMatchObject({ weight: 100, repetitions: 10 }); });
  it("does not invent missing weight", () => { const parsed = parseWorkoutTranscript(`${deadlift} 10${rep} 3${set}`); expect(parsed.exercises[0]?.sets[0]).toMatchObject({ weight: null, repetitions: 10 }); });
  it("keeps final changed set", () => { const parsed = parseWorkoutTranscript(`${squat} 80${kilo} 10${rep} 3${set} 90${kilo} 6${rep}`); expect(parsed.exercises[0]?.sets[3]).toMatchObject({ weight: 90, repetitions: 6 }); });
});
