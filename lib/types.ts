import { z } from "zod";

export const TriageSchema = z.object({
  topic: z.enum([
    "billing", 
    "technical", 
    "account", 
    "delivery", 
    "cancellation",
    "feedback",
    "complaint",
    "praise",
    "sales",
    "spam",
    "offtopic",
    "other"
  ]),
  topicConfidence: z.number().min(0).max(1),
  
  urgencyScore: z.number().min(0).max(3), // 0: Routine ... 3: Critical
  
  escalationProbability: z.number().min(0).max(1),
});

export type TriageResult = z.infer<typeof TriageSchema> & {
  provider: "jev" | "llm-fallback" | "rules-fallback" | "hive-vision";
  latencyMs: number;
};

export interface Ticket {
  id: string;
  customerName: string;
  message: string;
  createdAt: string;
  chatId?: number;
  status?: "new" | "replied";
  triageCache?: TriageResult; // To store Jev's triage result so we don't re-fetch
}

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
}
