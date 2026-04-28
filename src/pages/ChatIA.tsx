import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles,
  ArrowRight
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
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [expandedTransactions, setExpandedTransactions] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickSuggestions = [
    "Quanto gastei este mês?",
    `Quanto o ${person2} gastou no crédito este mês?`,
    "Total do casal no mês atual",
    "Top 10 gastos do mês",
    "Gastos por categoria no mês atual",
    "Parcelamentos ativos e quanto falta",
    "Contas a vencer nos próximos 7 dias",
  ];

  const loadingTexts = [
    "Analisando lançamentos...",
    "Cruzando categorias e valores...",
    "Calculando os totais...",
    "Gerando a melhor resposta..."
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingTextIndex]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTextIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

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
        },
      });

      if (error) {
        // Handle specific error codes
        const errorContext = error.context || {};
        const status = errorContext.status || error.status;
        
        if (status === 429) {
          toast({
            title: "Limite atingido",
            description: "Aguarde alguns segundos antes de enviar outra mensagem.",
            variant: "destructive",
          });
          throw new Error("Limite de requisições atingido. Tente novamente em alguns segundos.");
        }
        
        if (status === 402) {
          toast({
            title: "Créditos insuficientes",
            description: "Adicione créditos à sua conta para continuar usando o Chat IA.",
            variant: "destructive",
          });
          throw new Error("Créditos insuficientes. Adicione créditos para continuar.");
        }
        
        throw error;
      }

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
      
      // Only show generic toast if not already shown for specific errors
      if (!error.message?.includes("Limite") && !error.message?.includes("Créditos")) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível processar sua pergunta.",
          variant: "destructive",
        });
      }
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error.message || "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setInput(messageText); // Retain input context on error
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
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 h-[calc(100dvh-70px)] sm:h-[calc(100dvh-80px)] flex flex-col">
        <div className="flex flex-col flex-1 h-full min-h-0 bg-background sm:bg-transparent">
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

            {/* Hero / Empty State */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-10 px-2 sm:px-4 text-center animate-fade-up">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3 tracking-tight">Como posso ajudar hoje?</h2>
                <p className="text-muted-foreground max-w-md mb-8 text-sm sm:text-base leading-relaxed">
                  Sou seu assistente financeiro. Tire dúvidas sobre os gastos do casal, compare os meses ou veja os maiores lançamentos.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  {quickSuggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="p-4 border border-border/60 bg-card rounded-xl hover:bg-secondary/60 hover:border-border transition-all group flex flex-col gap-2 shadow-sm"
                    >
                      <span className="text-sm font-medium text-foreground">{suggestion}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>

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
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/50 rounded-2xl px-5 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground animate-pulse">
                          {loadingTexts[loadingTextIndex]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="mt-4 shrink-0">
              <div className="relative flex items-end gap-2 p-2 bg-background border border-border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem para o assistente..."
                  disabled={isLoading}
                  className="flex-1 min-h-[44px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 py-3 px-3 text-base sm:text-sm"
                  rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl w-10 h-10 mb-1 shrink-0"
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2 hidden sm:block">
                A IA pode cometer erros. Sempre verifique as transações agrupadas.
              </p>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
