import { Telegraf } from 'telegraf';
import fetch from 'node-fetch'; // requires node-fetch or native fetch in node 18+

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

bot.start((ctx) => {
  ctx.reply('Здравствуйте! Добро пожаловать в службу поддержки SmartSupport AI. Опишите вашу проблему, и мы постараемся помочь вам как можно быстрее.');
});

bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;
    
    // Отправляем сообщение в наше API для автоматической классификации (Jev AI)
    const response = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: text,
        customerName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ''),
        chatId: ctx.chat.id
      }),
    });
    
    const data = await response.json();
    
    // Если есть автоответ (например Спам/Оффтоп), сразу отправляем
    if (data.tickets && data.tickets[0]?.autoReply) {
      await ctx.reply(data.tickets[0].autoReply);
    } else {
      await ctx.reply('Ваше обращение принято в обработку (ИИ анализирует запрос). Ожидайте ответа оператора или автоответа.');
    }
  } catch (error) {
    console.error('Ошибка при отправке в API:', error);
    ctx.reply('Произошла ошибка системы. Пожалуйста, попробуйте позже.');
  }
});

console.log('SmartSupport Telegram Bot запущен!');
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
