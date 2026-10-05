import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { processTicketTriage } from '@/lib/decision-provider';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'tickets.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const tickets = JSON.parse(fileContent);
    return NextResponse.json(tickets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    let items = [];
    
    // Support { messages: ["string", "string"] } or array of objects
    if (payload.messages && Array.isArray(payload.messages)) {
      items = payload.messages.map((m: any) => typeof m === 'string' ? { message: m } : m);
    }
    // Support { message, customerName, chatId } from telegram
    else if (payload.message) {
      items = [payload];
    }

    // Process all incoming tickets with Jev AI concurrently on arrival!
    const newTicketsData = await Promise.all(
      items.filter((m: any) => m.message?.trim().length > 0).map(async (item: any) => {
        const text = item.message.trim();
        let triageData = null;
        try {
          triageData = await processTicketTriage(text);
        } catch (e) {
          console.error("Triage failed for incoming ticket", e);
        }

        let status = "new";
        let autoReply = null;
        if (triageData?.topic === "spam" || triageData?.topic === "offtopic") {
          status = "replied"; // Auto-resolve
          autoReply = triageData.topic === "spam" 
            ? "Ваше сообщение было распознано как спам и автоматически закрыто."
            : "Ваше сообщение классифицировано как оффтоп. Пожалуйста, задавайте вопросы только по теме сервиса.";
        }

        return {
          customerName: item.customerName || `Client ${Math.floor(Math.random() * 1000)}`,
          message: text,
          createdAt: new Date().toISOString(),
          chatId: item.chatId || 123456789,
          status,
          triageCache: triageData,
          autoReply
        };
      })
    );

    // Sync block: Read, assign IDs, and write to avoid race conditions.
    const filePath = path.join(process.cwd(), 'data', 'tickets.json');
    let tickets = [];
    if (fs.existsSync(filePath)) {
      tickets = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const maxIdMatch = tickets.length > 0 
      ? Math.max(...tickets.map((t: any) => {
          const m = t.id.match(/^TKT-(\d+)$/);
          return m ? parseInt(m[1], 10) : 1000;
        }))
      : 1000;

    const newTickets = newTicketsData.map((data, idx) => ({
      ...data,
      id: `TKT-${maxIdMatch + idx + 1}`
    }));

    const updatedTickets = [...newTickets, ...tickets];
    fs.writeFileSync(filePath, JSON.stringify(updatedTickets, null, 2));

    return NextResponse.json({ success: true, count: newTickets.length, tickets: newTickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const updates = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'tickets.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let tickets = JSON.parse(fileContent);

    tickets = tickets.map((t: any) => t.id === updates.id ? { ...t, ...updates } : t);
    
    fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
