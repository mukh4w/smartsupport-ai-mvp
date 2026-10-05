import { NextResponse } from 'next/server';
import { findRelevantArticles } from '@/lib/rag-service';
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { message, topic } = await req.json();
    
    // 1. RAG (Knowledge Base Search)
    const articles = findRelevantArticles(topic, message);
    const kbText = articles[0]?.content || "Нет подходящей инструкции.";
    
    // 2. Generate response using DeepSeek (System-2)
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const prompt = `You are an empathetic, professional support agent for an E-commerce service.
Your task is to write a reply to the customer's message based on the knowledge base article provided.

Customer message: "${message}"
Topic: "${topic}"

Knowledge Base Article to use:
"${kbText}"

Instructions:
1. Greet the customer appropriately (e.g., if they are angry, be empathetic; if standard, be polite).
2. If the company is at fault (like double charge or delay), sincerely apologize.
3. Provide the exact solution or next steps from the Knowledge Base article.
4. Explain the solution clearly, warmly, and with full context of the user's specific problem. Structure the answer nicely (e.g. use bullet points) if it helps readability. Write in professional, polite Russian.
5. Do not invent policies outside the KB article.
`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: "You are SmartSupport AI, a professional and helpful support assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        'x-sources': Buffer.from(JSON.stringify(articles)).toString('base64'),
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });

  } catch (err: any) {
    console.error("Copilot route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
