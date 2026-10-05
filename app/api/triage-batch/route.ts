import { NextResponse } from 'next/server';
import { processTicketTriage } from '@/lib/decision-provider';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) throw new Error("Expected array of messages");

    const results = await Promise.all(
      messages.filter((m: string) => m.trim().length > 0).map(async (msg: string, idx: number) => {
        const text = msg.trim();
        let triageData = null;
        try {
          triageData = await processTicketTriage(text);
        } catch (e) {
          console.error("Triage failed for simulated ticket", e);
        }

        return {
          id: `SIM-${Date.now()}-${idx}`,
          message: text,
          triageCache: triageData
        };
      })
    );

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
