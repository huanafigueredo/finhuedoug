import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface QueryFilters {
  periodo?: { inicio: string; fim: string };
  pessoa?: string[];
  tipo?: string[];
  forma_pagamento?: string[];
  instituicao?: string[];
  categoria?: string[];
  subcategoria?: string[];
  status?: string[];
  agrupar_por?: string | null;
  metrica?: string;
  busca_texto?: string;
  is_installment?: boolean;
  contas_pendentes?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current date info for context
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

    // Fetch categories and banks for context
    const { data: categories } = await supabase
      .from("categories")
      .select("name, type");
    
    const { data: banks } = await supabase
      .from("banks")
      .select("name");

    const { data: paymentMethods } = await supabase
      .from("payment_methods")
      .select("name");

    const categoryNames = categories?.map(c => c.name).join(", ") || "";
    const bankNames = banks?.map(b => b.name).join(", ") || "";
    const paymentMethodNames = paymentMethods?.map(p => p.name).join(", ") || "";

    const systemPrompt = `Você é um assistente financeiro do app CasalFin, usado por Huana e Douglas.
Você responde perguntas sobre finanças do casal baseado nos dados do app.

DATA ATUAL: ${now.toLocaleDateString("pt-BR")} (${currentYear}-${String(currentMonth).padStart(2, "0")})
MÊS ATUAL: ${startOfMonth} a ${endOfMonth}

REGRAS IMPORTANTES:
1. Quando o usuário não especificar período, use o MÊS ATUAL
2. Considere apenas lançamentos CONFIRMADOS (não inclua contas_agendadas pendentes nos totais)
3. Parcelamentos: considere apenas a parcela do mês, não o total da compra
4. Valores são em BRL (Real)
5. Pessoas válidas: Huana, Douglas, Casal, Empresa
6. Se a pergunta for ambígua, peça esclarecimento sobre: pessoa, período, tipo

DADOS DISPONÍVEIS:
- Categorias: ${categoryNames}
- Bancos/Instituições: ${bankNames}
- Formas de pagamento: ${paymentMethodNames}
- Campos da transação: date, description, type (expense/income), total_value, category, subcategory, for_who, paid_by, is_couple, bank_id, forma_pagamento, instituicao, is_installment, installment_number, total_installments

FORMATO DE RESPOSTA:
Quando a pergunta puder ser respondida com dados, retorne JSON com:
{
  "type": "query",
  "filters": {
    "periodo": {"inicio": "YYYY-MM-DD", "fim": "YYYY-MM-DD"},
    "pessoa": ["Huana"|"Douglas"|"Casal"|"Empresa"],
    "tipo": ["expense"|"income"],
    "forma_pagamento": ["credito"|"debito"|"pix"|"boleto"|"dinheiro"],
    "instituicao": ["nubank"|"inter"|etc],
    "categoria": [...],
    "subcategoria": [...],
    "busca_texto": "termo para buscar na descrição",
    "agrupar_por": "categoria"|"subcategoria"|"pessoa"|"instituicao"|null,
    "metrica": "soma"|"media"|"max"|"min"|"contagem",
    "is_installment": true|false,
    "contas_pendentes": true
  },
  "clarification_needed": null
}

Se precisar de esclarecimento:
{
  "type": "clarification",
  "clarification_needed": "Você quer ver gastos de Huana, Douglas ou do Casal?"
}

Se for pergunta de conversa geral:
{
  "type": "chat",
  "response": "Sua resposta aqui"
}`;

    // Step 1: Get structured query from AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    console.log("AI response:", aiContent);

    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      return new Response(JSON.stringify({
        type: "chat",
        response: aiContent || "Desculpe, não consegui processar sua pergunta.",
        transactions: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If clarification needed or chat response
    if (parsed.type === "clarification") {
      return new Response(JSON.stringify({
        type: "clarification",
        response: parsed.clarification_needed,
        transactions: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.type === "chat") {
      return new Response(JSON.stringify({
        type: "chat",
        response: parsed.response,
        transactions: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Execute query based on filters
    const filters: QueryFilters = parsed.filters || {};
    
    let query = supabase
      .from("transactions")
      .select(`
        id, date, description, type, total_value, category, subcategory,
        for_who, paid_by, is_couple, bank_id, forma_pagamento, instituicao,
        is_installment, installment_number, total_installments, installment_value,
        observacao, banks!transactions_bank_id_fkey(name)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Apply period filter
    if (filters.periodo) {
      query = query.gte("date", filters.periodo.inicio).lte("date", filters.periodo.fim);
    } else {
      // Default to current month
      query = query.gte("date", startOfMonth).lte("date", endOfMonth);
    }

    // Apply type filter
    if (filters.tipo && filters.tipo.length > 0) {
      query = query.in("type", filters.tipo);
    }

    // Apply person filter
    if (filters.pessoa && filters.pessoa.length > 0) {
      query = query.in("for_who", filters.pessoa);
    }

    // Apply category filter
    if (filters.categoria && filters.categoria.length > 0) {
      query = query.in("category", filters.categoria);
    }

    // Apply subcategory filter
    if (filters.subcategoria && filters.subcategoria.length > 0) {
      query = query.in("subcategory", filters.subcategoria);
    }

    // Apply forma_pagamento filter
    if (filters.forma_pagamento && filters.forma_pagamento.length > 0) {
      query = query.in("forma_pagamento", filters.forma_pagamento);
    }

    // Apply instituicao filter
    if (filters.instituicao && filters.instituicao.length > 0) {
      query = query.in("instituicao", filters.instituicao);
    }

    // Apply text search
    if (filters.busca_texto) {
      query = query.ilike("description", `%${filters.busca_texto}%`);
    }

    // Apply installment filter (only if explicitly true or false, not null)
    if (filters.is_installment === true || filters.is_installment === false) {
      query = query.eq("is_installment", filters.is_installment);
    }

    const { data: transactions, error: queryError } = await query.limit(100);

    if (queryError) {
      console.error("Query error:", queryError);
      throw new Error("Database query failed");
    }

    // Calculate metrics
    const txList = transactions || [];
    let total = 0;
    let count = txList.length;

    if (filters.metrica === "soma" || !filters.metrica) {
      total = txList.reduce((sum, t) => sum + Number(t.total_value || 0), 0);
    } else if (filters.metrica === "media") {
      total = count > 0 ? txList.reduce((sum, t) => sum + Number(t.total_value || 0), 0) / count : 0;
    } else if (filters.metrica === "max") {
      total = Math.max(...txList.map(t => Number(t.total_value || 0)), 0);
    } else if (filters.metrica === "min") {
      total = count > 0 ? Math.min(...txList.map(t => Number(t.total_value || 0))) : 0;
    } else if (filters.metrica === "contagem") {
      total = count;
    }

    // Group by if needed
    let groupedData: Record<string, number> | null = null;
    if (filters.agrupar_por) {
      groupedData = {};
      for (const t of txList) {
        const key = (t as any)[filters.agrupar_por] || "Sem categoria";
        groupedData[key] = (groupedData[key] || 0) + Number(t.total_value || 0);
      }
    }

    // Step 3: Generate human response
    const responseContext = {
      total,
      count,
      periodo: filters.periodo || { inicio: startOfMonth, fim: endOfMonth },
      filtros: filters,
      groupedData,
      transactions: txList.slice(0, 10).map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        value: t.total_value,
        category: t.category,
        for_who: t.for_who,
      })),
    };

    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente financeiro. Gere uma resposta clara e objetiva em português.
Destaque o VALOR TOTAL em negrito. Mencione o período e filtros usados.
Se houver agrupamento, liste os valores por grupo.
Seja conciso mas informativo. Use formatação markdown.
Formate valores em R$ com separador de milhar.`,
          },
          {
            role: "user",
            content: `Pergunta original: ${messages[messages.length - 1]?.content}

Resultado da consulta:
${JSON.stringify(responseContext, null, 2)}

Gere uma resposta amigável com o resultado.`,
          },
        ],
      }),
    });

    const summaryData = await summaryResponse.json();
    const finalResponse = summaryData.choices?.[0]?.message?.content || 
      `O total é **R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}** (${count} lançamentos).`;

    return new Response(JSON.stringify({
      type: "result",
      response: finalResponse,
      total,
      count,
      periodo: filters.periodo || { inicio: startOfMonth, fim: endOfMonth },
      filters,
      groupedData,
      transactions: txList.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        value: t.total_value,
        category: t.category,
        subcategory: t.subcategory,
        for_who: t.for_who,
        paid_by: t.paid_by,
        bank_name: (t as any).banks?.name,
        forma_pagamento: t.forma_pagamento,
        instituicao: t.instituicao,
        is_installment: t.is_installment,
        installment_number: t.installment_number,
        total_installments: t.total_installments,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("query-finance error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      type: "error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
