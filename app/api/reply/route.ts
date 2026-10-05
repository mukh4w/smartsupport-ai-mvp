import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);

export async function POST(req: Request) {
  try {
    const { chatId, message } = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ error: "No chatId provided" }, { status: 400 });
    }

    await bot.telegram.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👍 Помогло", callback_data: "rate_good" },
            { text: "👎 Не помогло", callback_data: "rate_bad" }
          ]
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reply route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
