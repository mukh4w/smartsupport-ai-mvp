"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/shared";
import { ArrowLeft, Rocket, Activity, Check, Table as TableIcon } from "lucide-react";
import Link from "next/link";

const TOPIC_COLORS: Record<string, string> = {
  billing: "bg-red-100 text-red-800",
  technical: "bg-orange-100 text-orange-800",
  account: "bg-blue-100 text-blue-800",
  delivery: "bg-purple-100 text-purple-800",
  cancellation: "bg-pink-100 text-pink-800",
  feedback: "bg-emerald-100 text-emerald-800",
  complaint: "bg-rose-100 text-rose-800",
  praise: "bg-green-100 text-green-800",
  sales: "bg-yellow-100 text-yellow-800",
  spam: "bg-stone-100 text-stone-800",
  offtopic: "bg-zinc-100 text-zinc-800",
  other: "bg-slate-100 text-slate-800"
};

export default function SimulatePage() {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleSend = async () => {
    const lines = inputText.split("\n").filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      setStatus("Пожалуйста, введите хотя бы одно сообщение.");
      return;
    }

    setIsSending(true);
    setStatus(`Мгновенная классификация ${lines.length} обращений...`);
    setStats(null);
    setResults([]);

    const start = Date.now();
    try {
      // Отправляем в специальный батч-рут, который НЕ сохраняет тикеты в базу!
      const res = await fetch("/api/triage-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: lines })
      });

      if (res.ok) {
        const data = await res.json();
        const latency = Date.now() - start;
        
        const topicCounts: Record<string, number> = {};
        let triagedCount = 0;
        data.results.forEach((t: any) => {
          if (t.triageCache) {
            triagedCount++;
            topicCounts[t.triageCache.topic] = (topicCounts[t.triageCache.topic] || 0) + 1;
          }
        });

        setStatus(`Успешно!`);
        setStats({ count: data.count, triagedCount, latency, topicCounts });
        setResults(data.results);
      } else {
        setStatus("Ошибка при классификации.");
      }
    } catch (e) {
      console.error(e);
      setStatus("Ошибка сети.");
    } finally {
      setIsSending(false);
    }
  };

  const loadDemoSet = () => {
    setInputText(
      "Привет, вы продаете гаражи?\n" +
      "Почему курьер опаздывает на 2 часа? Я замерз ждать на улице.\n" +
      "Отличный сервис, спасибо большое за вашу работу!\n" +
      "У меня списали деньги два раза за один и тот же заказ!\n" +
      "Не могу войти в личный кабинет, пишет неверный пароль.\n" +
      "Хочу отменить подписку.\n" +
      "Приложение вылетает, когда я открываю корзину. Ошибка 500.\n" +
      "Сколько стоит доставка в Екатеринбург?\n" +
      "Вы мошенники, буду жаловаться в Роспотребнадзор!"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Rocket className="text-indigo-600" /> System-1 Load Tester
        </h1>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Вернуться в Inbox
          </Button>
        </Link>
      </header>

      <div className="w-full max-w-5xl flex flex-col gap-6">
        <Card className="shadow-lg border-t-4 border-t-indigo-600">
          <CardHeader>
            <CardTitle>Тест массовой классификации</CardTitle>
            <p className="text-sm text-slate-500 mt-2">
              Вставьте обращения (каждое с новой строки). Jev AI за миллисекунды отсортирует их. 
              <b>Эти тикеты не попадают в Inbox</b>, это чистый тест скорости и точности классификатора.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-end">
               <Button variant="ghost" size="sm" onClick={loadDemoSet} className="text-indigo-600 text-xs">Загрузить демо-набор</Button>
            </div>
            <textarea
              className="w-full h-48 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Вставьте обращения..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">
                Найдено строк: {inputText.split("\n").filter(l => l.trim().length > 0).length}
              </span>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? <><Activity className="w-4 h-4 mr-2 animate-spin"/> Классификация...</> : "Только классифицировать"}
              </Button>
            </div>

            {status && (
              <div className={`mt-4 p-4 rounded-lg flex flex-col gap-2 ${stats ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-blue-50 text-blue-900'}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {stats ? <Check className="w-5 h-5 text-green-600"/> : <Activity className="w-5 h-5 animate-spin"/>}
                  {status}
                </div>
                
                {stats && (
                  <div className="mt-2 text-sm grid grid-cols-2 gap-4">
                    <div>
                      <p><b>Обработано:</b> {stats.count} шт.</p>
                      <p><b>Успешно классифицировано:</b> {stats.triagedCount} шт.</p>
                      <p><b>Общее время (Latency):</b> {(stats.latency / 1000).toFixed(2)} сек</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Распределение по топикам:</p>
                      <ul className="text-xs flex flex-col gap-1">
                        {Object.entries(stats.topicCounts).map(([topic, count]) => (
                          <li key={topic} className="flex justify-between border-b border-green-200/50 pb-1">
                            <span className="uppercase">{topic}</span>
                            <span className="font-bold">{String(count)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TableIcon className="w-5 h-5"/> Результаты классификации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b">
                    <tr>
                      <th className="px-4 py-3">Сообщение</th>
                      <th className="px-4 py-3 w-32">Топик</th>
                      <th className="px-4 py-3 w-24">Urgency</th>
                      <th className="px-4 py-3 w-24">Escalation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 max-w-md truncate">{r.message}</td>
                        <td className="px-4 py-3">
                          {r.triageCache ? (
                            <Badge className={`${TOPIC_COLORS[r.triageCache.topic] || "bg-slate-100"} uppercase text-[10px]`}>
                              {r.triageCache.topic}
                            </Badge>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.triageCache ? r.triageCache.urgencyScore.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.triageCache ? (r.triageCache.escalationProbability > 0.5 ? <span className="text-red-500 font-bold">YES</span> : "No") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
