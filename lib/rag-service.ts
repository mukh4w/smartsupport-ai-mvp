import knowledgeBase from '../data/knowledge.json';
import { KnowledgeArticle } from './types';

export function findRelevantArticles(topic: string, text: string): KnowledgeArticle[] {
  // 1. Жестко отсекаем по категории (сокращаем скоуп в 10 раз)
  const categoryArticles = knowledgeBase.filter(a => a.category === topic);
  
  // Если у нас "other" или ничего не найдено, ищем по всей базе
  const pool = categoryArticles.length > 0 ? categoryArticles : knowledgeBase;
  
  // 2. Наивный текстовый скоринг для MVP
  const words = text.toLowerCase().split(/[\s,!?.]+/).filter(w => w.length > 3);
  
  const scored = pool.map(article => {
    let score = 0;
    const content = article.content.toLowerCase();
    words.forEach(w => { if (content.includes(w)) score++; });
    return { article, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Топ 3 статьи
    .map(s => s.article);
}
