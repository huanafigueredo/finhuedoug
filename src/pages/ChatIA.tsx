import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePersonNames } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ExternalLink, 
  Copy, 
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  value: number;
  category?: string;
  subcategory?: string;
  for_who?: string;
  paid_by?: string;
  bank_name?: string;
  forma_pagamento?: string;
  instituicao?: string;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  transactions?: Transaction[];
  filters?: Record<string, any>;
  periodo?: { inicio: string; fim: string };
  total?: number;
  count?: number;
  groupedData?: Record<string, number>;
  timestamp: Date;
}


export default function ChatIA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { person1, person2 } = usePersonNames();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickSuggestions = [
    "Quanto gastei este mês?",
    `Quanto o ${person2} gastou no crédito este mês?`,
    "Total do casal no mês atual",
    "Top 10 gastos do mês",
    "Gastos por categoria no mês atual",
    "Parcelamentos ativos e quanto falta",
    "Contas a vencer nos próximos 7 dias",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("query-finance", {
        body: {
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: messageText }],
          userId: user?.id,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || data.error || "Não consegui processar sua pergunta.",
        transactions: data.transactions,
        filters: data.filters,
        periodo: data.periodo,
        total: data.total,
        count: data.count,
        groupedData: data.groupedData,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua pergunta.",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTransactions = (messageId: string) => {
    setExpandedTransactions((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const openFilteredTransactions = (filters: Record<string, any>, periodo?: { inicio: string; fim: string }) => {
    const params = new URLSearchParams();
    if (periodo) {
      params.set("from", periodo.inicio);
      params.set("to", periodo.fim);
    }
    if (filters.pessoa?.length) params.set("pessoa", filters.pessoa.join(","));
    if (filters.categoria?.length) params.set("categoria", filters.categoria.join(","));
    if (filters.tipo?.length) params.set("tipo", filters.tipo.join(","));
    
    navigate(`/lancamentos?${params.toString()}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-8">
        <div className="container mx-auto px-4 h-full max-w-4xl">
          <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Chat IA Financeiro</h1>
                <p className="text-sm text-muted-foreground">
                  Tire dúvidas sobre suas finanças
                </p>
              </div>
            </div>

            {/* Quick Suggestions */}
            {messages.length === 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      {/* Message Content */}
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br />")
                        }}
                      />

                      {/* Grouped Data */}
                      {message.groupedData && Object.keys(message.groupedData).length > 0 && (
                        <div className="mt-3 space-y-1">
                          {Object.entries(message.groupedData)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{key}</span>
                                <span className="font-medium">{formatCurrency(value)}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Transactions Preview */}
                      {message.transactions && message.transactions.length > 0 && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <button
                            onClick={() => toggleTransactions(message.id)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedTransactions[message.id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            Ver {message.transactions.length} lançamentos usados
                          </button>

                          {expandedTransactions[message.id] && (
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                              {message.transactions.slice(0, 10).map((t) => (
                                <div
                                  key={t.id}
                                  className="flex justify-between items-center text-sm p-2 bg-background/50 rounded-lg"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{t.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(t.date)} • {t.category || "Sem categoria"}
                                      {t.is_installment && ` • ${t.installment_number}/${t.total_installments}`}
                                    </p>
                                  </div>
                                  <span className="font-semibold ml-2">
                                    {formatCurrency(t.value)}
                                  </span>
                                </div>
                              ))}
                              {message.transactions.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  +{message.transactions.length - 10} lançamentos
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {message.role === "assistant" && message.filters && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFilteredTransactions(message.filters!, message.periodo)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver em Lançamentos
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(message.content.replace(/\*\*/g, ""))}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      )}

                      {/* Filters Used */}
                      {message.periodo && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {formatDate(message.periodo.inicio)} - {formatDate(message.periodo.fim)}
                          </Badge>
                          {message.filters?.pessoa?.map((p: string) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                          {message.filters?.categoria?.map((c: string) => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="mt-4 flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre suas finanças..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
