import { NextResponse } from 'next/server';
import { processTicketTriage } from '@/lib/decision-provider';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const triageResult = await processTicketTriage(message);
    return NextResponse.json(triageResult);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
