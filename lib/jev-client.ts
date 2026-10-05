import { TypeSafeClient, choice, score, noul } from "@typesafe-ai/sdk";
import { TriageSchema } from "./types";

const client = new TypeSafeClient({
  apiKey: process.env.TYPESAFE_API_KEY || "dummy",
});

export async function callJevApi(text: string) {
  const response = await client.systemOne({
    state: { message: text },
    questions: {
      topic: choice("What is the primary topic of the `message`?", {
        billing: "Issues with payments, double charges, refunds, or invoices",
        technical: "Bugs, crashes, app not working, or API issues",
        account: "Login problems, password reset, profile settings, or bans",
        delivery: "Shipping delays, courier problems, or lost packages",
        cancellation: "Order or subscription cancellation",
        feedback: "Feature requests, suggestions, or general feedback",
        complaint: "Complaints about service quality, staff, or policies without a specific technical issue",
        praise: "Thanking the support team, expressing satisfaction",
        sales: "Pre-sales questions, pricing inquiries, or bulk orders",
        spam: "Unsolicited advertisements, phishing, or bot spam",
        offtopic: "Informal chat, greetings with no question, jokes, or completely unrelated topics",
        other: "Valid requests that do not fit the above categories",
      }),
      urgency: score("How urgent is the `message` based on customer sentiment and issue type?", [
        "Routine inquiry or feature request",
        "Standard issue, no immediate blocker",
        "Urgent issue, blocking the user, high frustration",
        "Critical issue, threats of legal action or severe service outage",
      ]),
      escalation: noul("Does the `message` require immediate human intervention or contain threats?"),
    },
  });

  const topicAns = response.answers.topic;
  const topicConfidence = topicAns.confidence ?? 1;

  return TriageSchema.parse({
    topic: topicAns.choice,
    topicConfidence: topicConfidence,
    urgencyScore: response.answers.urgency.score,
    escalationProbability: response.answers.escalation.noul,
  });
}
