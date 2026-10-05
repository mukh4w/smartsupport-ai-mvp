"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shared";
import { ArrowLeft, Save, Trash2, Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import { KnowledgeArticle } from "@/lib/types";

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge")
      .then(res => res.json())
      .then(data => setArticles(data))
      .catch(console.error);
  }, []);

  const saveKnowledgeBase = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articles)
      });
      alert("База знаний сохранена!");
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  const updateArticle = (index: number, field: string, value: string) => {
    const newArticles = [...articles];
    newArticles[index] = { ...newArticles[index], [field]: value };
    setArticles(newArticles);
  };

  const deleteArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const addArticle = () => {
    setArticles([
      ...articles, 
      { id: `KB-${Math.floor(Math.random()*1000)}`, category: "other", title: "Новая статья", content: "Текст инструкции" }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> Редактор FAQ (Knowledge Base)
        </h1>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Вернуться в Inbox
          </Button>
        </Link>
      </header>

      <div className="w-full max-w-4xl mx-auto">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 pb-4 mb-4">
            <CardTitle className="text-lg">Управление правилами и инструкциями</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addArticle}><Plus className="w-4 h-4 mr-1"/> Добавить статью</Button>
              <Button size="sm" onClick={saveKnowledgeBase} disabled={isSaving}>
                <Save className="w-4 h-4 mr-1"/> {isSaving ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 overflow-y-auto pb-8">
            {articles.map((art, i) => (
              <div key={art.id} className="p-4 border rounded-xl bg-white shadow-sm flex flex-col gap-3 relative group">
                <Button 
                  size="sm" variant="ghost" 
                  className="absolute top-3 right-3 text-red-500 opacity-50 hover:opacity-100"
                  onClick={() => deleteArticle(i)}
                >
                  <Trash2 className="w-4 h-4"/>
                </Button>
                
                <div className="grid grid-cols-3 gap-4 mr-12">
                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold uppercase">ID</label>
                    <input disabled className="border p-2 text-sm font-medium rounded bg-slate-50" value={art.id} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold uppercase">Категория (Topic)</label>
                    <input 
                      className="border p-2 text-sm font-medium rounded w-full" 
                      value={art.category} 
                      onChange={e => updateArticle(i, "category", e.target.value)}
                      placeholder="billing, account, delivery..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs text-slate-500 font-semibold uppercase">Заголовок для оператора</label>
                  <input 
                    className="border p-2 text-sm rounded w-full font-medium" 
                    value={art.title} 
                    onChange={e => updateArticle(i, "title", e.target.value)}
                    placeholder="Название проблемы"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs text-slate-500 font-semibold uppercase">Официальный текст инструкции / Политика компании</label>
                  <textarea 
                    className="border p-3 text-sm rounded w-full h-32 leading-relaxed"
                    value={art.content}
                    onChange={e => updateArticle(i, "content", e.target.value)}
                    placeholder="Этот текст Jev AI будет использовать для сборки ответа клиенту..."
                  />
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="text-center p-12 text-slate-400 border-2 border-dashed rounded-xl">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>База знаний пуста. Добавьте статьи, чтобы AI Copilot мог опираться на них.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
