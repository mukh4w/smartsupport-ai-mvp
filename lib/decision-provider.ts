import { TriageResult } from "./types";
import { callJevApi } from "./jev-client";

export async function processTicketTriage(text: string): Promise<TriageResult> {
  const start = Date.now();
  
  try {
    // 1. Try Jev (System 1) - Strict Requirement
    if (!process.env.TYPESAFE_API_KEY) {
       throw new Error("Missing TYPESAFE_API_KEY. Jev AI classification requires a valid TypeSafe key.");
    }
    const result = await callJevApi(text);
    return {
      ...result,
      provider: "jev",
      latencyMs: Date.now() - start
    };
  } catch (error: any) {
    console.error("Jev AI Classification failed:", error.message);
    // 2. Rules Fallback ONLY (No LLM Fallback as requested)
    return {
      topic: "other",
      topicConfidence: 0.1,
      urgencyScore: 1,
      escalationProbability: 1,
      provider: "rules-fallback",
      latencyMs: Date.now() - start
    };
  }
}
