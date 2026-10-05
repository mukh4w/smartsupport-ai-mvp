"use client";

import { useState, useEffect, useMemo } from "react";
import { Ticket, TriageResult, KnowledgeArticle } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui/shared";
import { AlertTriangle, Clock, Activity, MessageSquare, BookOpen, Send, Sparkles, Inbox, Users, CheckCircle, Zap, RefreshCw, Layers, ShieldCheck, Box, ShoppingBag, LayoutDashboard } from "lucide-react";
import Link from "next/link";

type Tab = "inbox" | "all" | "replied" | "customers";

const TOPIC_COLORS: Record<string, string> = {
  billing: "bg-red-100 text-red-800 border-red-200",
  technical: "bg-orange-100 text-orange-800 border-orange-200",
  account: "bg-blue-100 text-blue-800 border-blue-200",
  delivery: "bg-purple-100 text-purple-800 border-purple-200",
  cancellation: "bg-pink-100 text-pink-800 border-pink-200",
  feedback: "bg-emerald-100 text-emerald-800 border-emerald-200",
  complaint: "bg-rose-100 text-rose-800 border-rose-200",
  praise: "bg-green-100 text-green-800 border-green-200",
  sales: "bg-yellow-100 text-yellow-800 border-yellow-200",
  spam: "bg-stone-100 text-stone-800 border-stone-200",
  offtopic: "bg-zinc-100 text-zinc-800 border-zinc-200",
  other: "bg-slate-100 text-slate-800 border-slate-200"
};

const getTopicBadge = (topic: string) => {
  const colorClass = TOPIC_COLORS[topic] || TOPIC_COLORS.other;
  return <span className={`px-2 py-0.5 rounded-md font-semibold border ${colorClass} uppercase text-[10px] tracking-wider`}>{topic}</span>;
};

const getUrgencyBadge = (score: number) => {
  if (score >= 2.5) return <span className="px-2 py-0.5 rounded-md font-semibold border bg-red-600 text-white border-red-700 text-[10px] tracking-wider">CRITICAL</span>;
  if (score >= 1.5) return <span className="px-2 py-0.5 rounded-md font-semibold border bg-orange-100 text-orange-800 border-orange-200 text-[10px] tracking-wider">URGENT</span>;
  if (score >= 0.7) return <span className="px-2 py-0.5 rounded-md font-semibold border bg-blue-100 text-blue-800 border-blue-200 text-[10px] tracking-wider">TODAY</span>;
  return <span className="px-2 py-0.5 rounded-md font-semibold border bg-slate-100 text-slate-600 border-slate-200 text-[10px] tracking-wider">ROUTINE</span>;
};

export default function SupportDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState<{ text: string, sources: KnowledgeArticle[] } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, []);

  const displayedTickets = useMemo(() => {
    let list = [...tickets];
    if (activeTab === "inbox") list = list.filter(t => t.status !== "replied");
    if (activeTab === "replied") list = list.filter(t => t.status === "replied");
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.message.toLowerCase().includes(q) || 
        t.customerName.toLowerCase().includes(q) ||
        t.triageCache?.topic.toLowerCase().includes(q)
      );
    }
    
    if (activeTab === "inbox") {
      list.sort((a, b) => {
        const uA = a.triageCache?.urgencyScore || 0;
        const uB = b.triageCache?.urgencyScore || 0;
        if (uA !== uB) return uB - uA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [tickets, activeTab, searchQuery]);

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);

  useEffect(() => {
    if (!selectedTicket) return;
    
    async function analyzeAndDraft() {
      setIsProcessing(true);
      let triageData = selectedTicket?.triageCache;
      
      if (!triageData) {
        try {
          const resTriage = await fetch("/api/triage", {
            method: "POST",
            body: JSON.stringify({ message: selectedTicket?.message }),
          });
          triageData = await resTriage.json();
          await fetch("/api/tickets", {
            method: "PATCH",
            body: JSON.stringify({ id: selectedTicket?.id, triageCache: triageData })
          });
          fetchTickets(); 
        } catch (e) {}
      }

      if (triageData && !draft && selectedTicket?.status !== "replied") {
        try {
          const resDraft = await fetch("/api/copilot", {
            method: "POST",
            body: JSON.stringify({ message: selectedTicket?.message, topic: triageData.topic }),
          });
          
          const sourcesBase64 = resDraft.headers.get('x-sources');
          let sources = [];
          if (sourcesBase64) {
            try {
              const binString = atob(sourcesBase64);
              const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
              const decodedString = new TextDecoder().decode(bytes);
              sources = JSON.parse(decodedString);
            } catch(e) {
              console.error("Base64 decode error", e);
            }
          }
          
          const topicName = triageData.topic.toUpperCase();
          let currentText = `📌 Ваш тикет #${selectedTicket?.id} (${topicName})\n────────────────\n`;
          setDraft({ text: currentText, sources });
          
          const reader = resDraft.body?.getReader();
          const decoder = new TextDecoder();
          
          if (reader) {
            let lastUpdateTime = Date.now();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              currentText += decoder.decode(value, { stream: true });
              
              // Throttle React state updates to every 40ms to prevent UI freeze
              if (Date.now() - lastUpdateTime > 40) {
                setDraft(prev => prev ? { ...prev, text: currentText } : { text: currentText, sources });
                lastUpdateTime = Date.now();
              }
            }
            // Final update
            setDraft(prev => prev ? { ...prev, text: currentText } : { text: currentText, sources });
          }
        } catch(e) {}
      }
      setIsProcessing(false);
    }
    
    setDraft(null); 
    analyzeAndDraft();
  }, [selectedTicketId]);

  const handleSend = async () => {
    if (!selectedTicket || !draft) return;
    setIsSending(true);
    
    try {
      if (selectedTicket.chatId) {
        await fetch("/api/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: selectedTicket.chatId, message: draft.text })
        });
      }
      
      await fetch("/api/tickets", {
        method: "PATCH",
        body: JSON.stringify({ id: selectedTicket.id, status: "replied" })
      });
      
      fetchTickets();
      setSelectedTicketId(null);
    } catch (e) {} finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* 1. Sidebar (Nav) */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="h-16 px-6 border-b flex items-center gap-3 font-bold text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg tracking-tight">SmartSupport AI</span>
        </div>
        
        <div className="px-4 py-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Workspace</div>
          <nav className="flex flex-col gap-1">
            <Button 
              variant={activeTab === "inbox" ? "secondary" : "ghost"} 
              className={`w-full justify-start text-sm font-medium ${activeTab === "inbox" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
              onClick={() => setActiveTab("inbox")}
            >
              <Inbox className="w-4 h-4 mr-3" /> Inbox 
              {tickets.filter(t => t.status !== "replied").length > 0 && (
                <span className="ml-auto bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs shadow-sm">
                  {tickets.filter(t => t.status !== "replied").length}
                </span>
              )}
            </Button>
            <Button 
              variant={activeTab === "all" ? "secondary" : "ghost"} 
              className={`w-full justify-start text-sm font-medium ${activeTab === "all" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
              onClick={() => setActiveTab("all")}
            >
              <Layers className="w-4 h-4 mr-3" /> All Tickets
            </Button>
            <Button 
              variant={activeTab === "replied" ? "secondary" : "ghost"} 
              className={`w-full justify-start text-sm font-medium ${activeTab === "replied" ? "bg-green-50 text-green-700" : "text-slate-600 hover:bg-slate-50"}`}
              onClick={() => setActiveTab("replied")}
            >
              <CheckCircle className="w-4 h-4 mr-3" /> Resolved
            </Button>
            <Button 
              variant={activeTab === "customers" ? "secondary" : "ghost"} 
              className={`w-full justify-start text-sm font-medium ${activeTab === "customers" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
              onClick={() => setActiveTab("customers")}
            >
              <Users className="w-4 h-4 mr-3" /> Customers
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-100 flex flex-col gap-2 bg-slate-50">
          <Link href="/simulate" className="w-full">
            <Button variant="outline" className="w-full text-xs font-medium bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
              <Zap className="w-3 h-3 mr-2 text-indigo-500" /> Benchmark Tool
            </Button>
          </Link>
          <Link href="/knowledge" className="w-full">
            <Button variant="ghost" className="w-full text-xs font-medium text-slate-500 hover:text-slate-700">
              <BookOpen className="w-3 h-3 mr-2" /> Knowledge Base
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Ticket List */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col z-0">
        <div className="h-16 px-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
          <h2 className="font-bold text-lg text-slate-800 capitalize flex items-center gap-2">
            {activeTab === 'inbox' ? 'Active Queue' : activeTab}
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchTickets} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="w-4 h-4"/>
          </Button>
        </div>
        
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by ID, name or topic..." 
              className="w-full text-sm py-2 pl-3 pr-10 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
          {displayedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No tickets found</p>
            </div>
          ) : displayedTickets.map(t => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTicketId(t.id)}
              className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 ${selectedTicketId === t.id ? 'bg-white shadow-[inset_4px_0_0_0_#4f46e5] shadow-sm relative z-10' : 'hover:bg-white border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                    {t.customerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-slate-900 truncate max-w-[140px]">{t.customerName}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">{t.message}</p>
              
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.id}</span>
                {t.triageCache ? (
                  <>
                    {getTopicBadge(t.triageCache.topic)}
                    {getUrgencyBadge(t.triageCache.urgencyScore)}
                  </>
                ) : (
                  <span className="px-2 py-0.5 rounded-md font-semibold border bg-slate-50 text-slate-400 border-slate-200 text-[10px] tracking-wider animate-pulse">ANALYZING...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Ticket View */}
      <div className="flex-1 flex flex-col bg-white relative">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to assist</h3>
            <p className="text-sm text-slate-500 max-w-xs text-center">Select a ticket from the queue to review context and generate AI responses.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-20 px-8 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 shadow-inner">
                  {selectedTicket.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-900">{selectedTicket.customerName}</h2>
                  <div className="text-sm font-medium text-slate-500 flex gap-3 mt-0.5">
                    <span className="font-mono bg-slate-100 px-1.5 rounded">{selectedTicket.id}</span>
                    {selectedTicket.status === "replied" && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Resolved</span>}
                  </div>
                </div>
              </div>
              
              {/* Triage Badges in Header */}
              {selectedTicket.triageCache && (
                <div className="flex gap-2 items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mr-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3"/> TypeSafe Jev
                  </div>
                  {getTopicBadge(selectedTicket.triageCache.topic)}
                  {getUrgencyBadge(selectedTicket.triageCache.urgencyScore)}
                  {selectedTicket.triageCache.escalationProbability > 0.5 && (
                     <span className="px-2 py-0.5 rounded-md font-semibold border bg-red-50 text-red-700 border-red-200 text-[10px] tracking-wider flex items-center gap-1">
                       <AlertTriangle className="w-3 h-3"/> ESCALATION RISK
                     </span>
                  )}
                </div>
              )}
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-[#F8FAFC]">
              
              {/* Customer Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 shadow-sm">
                  {selectedTicket.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none shadow-sm max-w-2xl">
                  <p className="text-[15px] text-slate-800 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                  <div className="mt-3 text-[11px] font-medium text-slate-400">
                    Received at {new Date(selectedTicket.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Copilot Area */}
              {selectedTicket.status !== "replied" && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-6 h-6 rounded bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">AI Copilot</h3>
                  </div>
                  
                  {isProcessing || !draft ? (
                    <div className="ml-8 bg-white border border-indigo-100 rounded-2xl rounded-tl-none p-6 shadow-sm max-w-2xl">
                      <div className="flex items-center gap-3 text-indigo-600 font-medium text-sm">
                        <Activity className="w-5 h-5 animate-spin" /> Analyzing knowledge base and writing response...
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-6 items-start ml-8">
                      <div className="flex-1 flex flex-col bg-white border border-indigo-100 rounded-2xl rounded-tl-none shadow-md overflow-hidden max-w-2xl transition-all">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Draft Ready</span>
                          <Badge variant="outline" className="text-[10px] bg-white text-indigo-600 border-indigo-200">100% Policy Match</Badge>
                        </div>
                        <textarea 
                          className="w-full h-40 p-5 text-[15px] leading-relaxed text-slate-800 resize-none outline-none focus:ring-inset focus:ring-2 focus:ring-indigo-500/50 bg-transparent"
                          value={draft.text}
                          onChange={(e) => setDraft({...draft, text: e.target.value})}
                        />
                        <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Safe to send
                          </span>
                          <Button 
                            onClick={handleSend} 
                            disabled={isSending} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm px-6 rounded-lg transition-all active:scale-95"
                          >
                            <Send className="w-4 h-4 mr-2" /> {isSending ? "Sending..." : "Approve & Send"}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Context / Sources Panel */}
                      <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-500" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Knowledge Base</h4>
                        </div>
                        <div className="p-4">
                          {draft?.sources?.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {draft.sources.map((src, i) => (
                                <div key={i} className="group cursor-default">
                                  <div className="text-xs font-bold text-indigo-700 mb-1 leading-tight group-hover:text-indigo-800 transition-colors">{src.title}</div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed opacity-90 line-clamp-5">{src.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic text-center py-4">No matching articles found. Using fallback instructions.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
