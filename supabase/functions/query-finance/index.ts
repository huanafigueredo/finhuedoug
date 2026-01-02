import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const allowedOrigins = [
  'https://zpkiayaliicipxcjetqh.lovableproject.com',
  'https://id-preview--zpkiayaliicipxcjetqh.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

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

// Helper function to get correct transaction value (handles installments)
function getTransactionValue(t: any): number {
  // For dynamic installments (single record), use installment_value
  if (t.is_installment && !t.is_generated_installment && t.installment_value) {
    return Number(t.installment_value);
  }
  return Number(t.total_value || 0);
}

// Calculate which installment number should appear in a given month
function calculateInstallmentForMonth(
  transactionDate: string,
  totalInstallments: number,
  targetMonth: number,
  targetYear: number
): { installmentNumber: number; shouldShow: boolean } {
  const txDate = new Date(transactionDate);
  const txMonth = txDate.getMonth();
  const txYear = txDate.getFullYear();

  // Calculate months difference
  const monthsDiff = (targetYear - txYear) * 12 + (targetMonth - txMonth);
  
  // Installment number is 1-indexed
  const installmentNumber = monthsDiff + 1;
  
  // Should show if within valid range
  const shouldShow = installmentNumber >= 1 && installmentNumber <= totalInstallments;
  
  return { installmentNumber, shouldShow };
}

// Check if a transaction should appear in the target period
function shouldIncludeTransaction(
  t: any,
  startDate: string,
  endDate: string
): { include: boolean; projectedInstallmentNumber?: number } {
  const txDate = new Date(t.date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // For non-installment transactions, use simple date range check
  if (!t.is_installment || t.is_generated_installment) {
    const isInRange = txDate >= start && txDate <= end;
    return { include: isInRange };
  }
  
  // For dynamic installments, check if any parcela falls within the period
  const totalInstallments = t.total_installments || 1;
  
  // Check each month in the target period
  const startMonth = start.getMonth();
  const startYear = start.getFullYear();
  const endMonth = end.getMonth();
  const endYear = end.getFullYear();
  
  // For simplicity, check the start month of the period (most common case)
  const { installmentNumber, shouldShow } = calculateInstallmentForMonth(
    t.date,
    totalInstallments,
    startMonth,
    startYear
  );
  
  if (shouldShow) {
    return { include: true, projectedInstallmentNumber: installmentNumber };
  }
  
  // If period spans multiple months, also check end month
  if (startMonth !== endMonth || startYear !== endYear) {
    const endCheck = calculateInstallmentForMonth(
      t.date,
      totalInstallments,
      endMonth,
      endYear
    );
    if (endCheck.shouldShow) {
      return { include: true, projectedInstallmentNumber: endCheck.installmentNumber };
    }
  }
  
  return { include: false };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Validate authentication from JWT instead of trusting client-supplied userId
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's auth token to enforce RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const userId = user.id;

    // Get current date info for context
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

    // Fetch user settings for person names
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("person_1_name, person_2_name")
      .eq("user_id", userId)
      .single();
    
    const person1Name = userSettings?.person_1_name || "Huana";
    const person2Name = userSettings?.person_2_name || "Douglas";

    // Fetch split settings for expense division
    const { data: splitSettings } = await supabase
      .from("split_settings")
      .select("mode, person1_percentage, person2_percentage")
      .eq("user_id", userId)
      .single();

    // Fetch category splits for category-specific rules
    const { data: categorySplits } = await supabase
      .from("category_splits")
      .select("category_name, subcategory_name, person1_percentage, person2_percentage")
      .eq("user_id", userId);

    // Fetch couple members for proportional split calculation
    const { data: coupleMembers } = await supabase
      .from("couple_members")
      .select("position, monthly_income_cents")
      .eq("user_id", userId);

    // Fetch categories and banks for context
    const { data: categories } = await supabase
      .from("categories")
      .select("name, type");
    
    const { data: banks } = await supabase
      .from("banks")
      .select("id, name");

    const { data: paymentMethods } = await supabase
      .from("payment_methods")
      .select("id, name");

    const categoryNames = categories?.map(c => c.name).join(", ") || "";
    const bankNames = banks?.map(b => b.name).join(", ") || "";
    const paymentMethodNames = paymentMethods?.map(p => p.name).join(", ") || "";

    // Helper function to calculate split percentages
    // Hierarchy: 1) Custom transaction split, 2) Category rule, 3) Global settings
    function getSplitPercentages(
      category?: string | null, 
      subcategory?: string | null,
      customP1?: number | null,
      customP2?: number | null
    ): { p1Pct: number; p2Pct: number } {
      // 0. Check for transaction-level custom split (highest priority)
      if (customP1 !== undefined && customP1 !== null && 
          customP2 !== undefined && customP2 !== null) {
        return { p1Pct: customP1, p2Pct: customP2 };
      }

      // 1. Check for subcategory-specific rule
      if (subcategory && categorySplits) {
        const subRule = categorySplits.find(r => 
          r.category_name === category && r.subcategory_name === subcategory
        );
        if (subRule) {
          return { p1Pct: subRule.person1_percentage, p2Pct: subRule.person2_percentage };
        }
      }

      // 2. Check for category-specific rule (without subcategory)
      if (category && categorySplits) {
        const catRule = categorySplits.find(r => 
          r.category_name === category && !r.subcategory_name
        );
        if (catRule) {
          return { p1Pct: catRule.person1_percentage, p2Pct: catRule.person2_percentage };
        }
      }

      // 3. Use global settings
      const mode = splitSettings?.mode || "50-50";

      if (mode === "proporcional" && coupleMembers && coupleMembers.length >= 2) {
        const person1 = coupleMembers.find(m => m.position === 1);
        const person2 = coupleMembers.find(m => m.position === 2);
        const income1 = person1?.monthly_income_cents || 0;
        const income2 = person2?.monthly_income_cents || 0;
        const totalIncome = income1 + income2;

        if (totalIncome > 0) {
          return { 
            p1Pct: Math.round((income1 / totalIncome) * 100), 
            p2Pct: Math.round((income2 / totalIncome) * 100) 
          };
        }
      }

      if (mode === "personalizado" && splitSettings) {
        return { 
          p1Pct: splitSettings.person1_percentage || 50, 
          p2Pct: splitSettings.person2_percentage || 50 
        };
      }

      // Default 50-50
      return { p1Pct: 50, p2Pct: 50 };
    }

    // Get transaction value adjusted for person filter
    // Now considers custom transaction-level splits
    function getPersonValue(t: any, personFilter?: string): number {
      const baseValue = getTransactionValue(t);
      
      if (!personFilter || !t.is_couple) {
        return baseValue;
      }

      // Pass custom split percentages from the transaction
      const { p1Pct, p2Pct } = getSplitPercentages(
        t.category, 
        t.subcategory,
        t.custom_person1_percentage,
        t.custom_person2_percentage
      );
      
      if (personFilter === person1Name) {
        return baseValue * (p1Pct / 100);
      } else if (personFilter === person2Name) {
        return baseValue * (p2Pct / 100);
      }
      
      return baseValue;
    }

    const systemPrompt = `Você é um assistente financeiro do app together finanças, usado por ${person1Name} e ${person2Name}.
Você responde perguntas sobre finanças do casal baseado nos dados do app.

DATA ATUAL: ${now.toLocaleDateString("pt-BR")} (${currentYear}-${String(currentMonth).padStart(2, "0")})
MÊS ATUAL: ${startOfMonth} a ${endOfMonth}

REGRAS IMPORTANTES:
1. Quando o usuário não especificar período, use o MÊS ATUAL
2. Considere apenas lançamentos CONFIRMADOS (não inclua contas_agendadas pendentes nos totais)
3. Parcelamentos: considere apenas a parcela do mês, não o total da compra
4. Valores são em BRL (Real)
5. Pessoas válidas: ${person1Name}, ${person2Name}, Casal, Empresa
6. Se a pergunta for ambígua, peça esclarecimento sobre: pessoa, período, tipo

DADOS DISPONÍVEIS:
- Categorias: ${categoryNames}
- Bancos/Instituições: ${bankNames}
- Formas de pagamento: ${paymentMethodNames}
- Campos da transação: date, description, type (expense/income), total_value, category, subcategory, for_who, paid_by, is_couple, bank_id, payment_method_id, is_installment, installment_number, total_installments

FORMATO DE RESPOSTA:
Quando a pergunta puder ser respondida com dados, retorne JSON com:
{
  "type": "query",
  "filters": {
    "periodo": {"inicio": "YYYY-MM-DD", "fim": "YYYY-MM-DD"},
    "pessoa": ["${person1Name}"|"${person2Name}"|"Casal"|"Empresa"],
    "tipo": ["expense"|"income"],
    "forma_pagamento": ["Cartão de Crédito"|"Cartão de Débito"|"PIX"|"Boleto"|"Dinheiro"],
    "instituicao": ["Nubank"|"Inter"|"Itaú"|etc],
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

IMPORTANTE sobre forma_pagamento e instituicao:
- forma_pagamento: Use os nomes EXATOS das formas de pagamento cadastradas: ${paymentMethodNames}
- instituicao: Use os nomes EXATOS dos bancos cadastrados: ${bankNames}
- Quando o usuário mencionar "crédito", "cartão de crédito" → use "Cartão de Crédito" em forma_pagamento
- Quando mencionar "débito", "cartão de débito" → use "Cartão de Débito" em forma_pagamento
- Quando mencionar um banco como "Nubank", "Inter" → use em instituicao

Se precisar de esclarecimento:
{
  "type": "clarification",
  "clarification_needed": "Você quer ver gastos de ${person1Name}, ${person2Name} ou do Casal?"
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
    
    // Determine the period for the query
    const queryStartDate = filters.periodo?.inicio || startOfMonth;
    const queryEndDate = filters.periodo?.fim || endOfMonth;
    
    // For installment projection, we need to fetch installments that started before the period
    // Calculate how far back we need to look (max 36 months for safety)
    const periodStart = new Date(queryStartDate);
    const lookbackDate = new Date(periodStart);
    lookbackDate.setMonth(lookbackDate.getMonth() - 36);
    const lookbackDateStr = lookbackDate.toISOString().split("T")[0];
    
    // Build base query with all needed fields (including custom split percentages)
    let baseQuery = supabase
      .from("transactions")
      .select(`
        id, date, description, type, total_value, category, subcategory,
        for_who, paid_by, is_couple, bank_id, payment_method_id,
        is_installment, installment_number, total_installments, installment_value,
        is_generated_installment, observacao, savings_deposit_id,
        custom_person1_percentage, custom_person2_percentage,
        banks!transactions_bank_id_fkey(name), payment_methods!transactions_payment_method_id_fkey(name)
      `)
      .is("savings_deposit_id", null) // Exclude savings goal deposits (internal transfers)
      .order("date", { ascending: false });

    // Apply type filter
    if (filters.tipo && filters.tipo.length > 0) {
      baseQuery = baseQuery.in("type", filters.tipo);
    }

    // Apply person filter
    if (filters.pessoa && filters.pessoa.length > 0) {
      baseQuery = baseQuery.in("for_who", filters.pessoa);
    }

    // Apply category filter
    if (filters.categoria && filters.categoria.length > 0) {
      baseQuery = baseQuery.in("category", filters.categoria);
    }

    // Apply subcategory filter
    if (filters.subcategoria && filters.subcategoria.length > 0) {
      baseQuery = baseQuery.in("subcategory", filters.subcategoria);
    }

    // Apply forma_pagamento filter using payment_method_id lookup
    if (filters.forma_pagamento && filters.forma_pagamento.length > 0 && paymentMethods) {
      const matchingPaymentMethods = paymentMethods.filter(pm => 
        filters.forma_pagamento!.some(fp => 
          pm.name.toLowerCase().includes(fp.toLowerCase()) || 
          fp.toLowerCase().includes(pm.name.toLowerCase())
        )
      );
      if (matchingPaymentMethods.length > 0) {
        const pmIds = matchingPaymentMethods.map(pm => pm.id);
        baseQuery = baseQuery.in("payment_method_id", pmIds);
      }
    }

    // Apply instituicao filter using bank_id lookup
    if (filters.instituicao && filters.instituicao.length > 0 && banks) {
      const matchingBanks = banks.filter(b => 
        filters.instituicao!.some(inst => 
          b.name.toLowerCase().includes(inst.toLowerCase()) || 
          inst.toLowerCase().includes(b.name.toLowerCase())
        )
      );
      if (matchingBanks.length > 0) {
        const bankIds = matchingBanks.map(b => b.id);
        baseQuery = baseQuery.in("bank_id", bankIds);
      }
    }

    // Apply text search
    if (filters.busca_texto) {
      baseQuery = baseQuery.ilike("description", `%${filters.busca_texto}%`);
    }

    // Apply installment filter (only if explicitly true or false, not null)
    if (filters.is_installment === true || filters.is_installment === false) {
      baseQuery = baseQuery.eq("is_installment", filters.is_installment);
    }

    // Query 1: Regular transactions in the period
    const regularQuery = baseQuery
      .gte("date", queryStartDate)
      .lte("date", queryEndDate)
      .eq("is_installment", false);
    
    // Query 2: All installment transactions (we'll filter by projection)
    const installmentQuery = supabase
      .from("transactions")
      .select(`
        id, date, description, type, total_value, category, subcategory,
        for_who, paid_by, is_couple, bank_id, payment_method_id,
        is_installment, installment_number, total_installments, installment_value,
        is_generated_installment, observacao, savings_deposit_id,
        custom_person1_percentage, custom_person2_percentage,
        banks!transactions_bank_id_fkey(name), payment_methods!transactions_payment_method_id_fkey(name)
      `)
      .eq("is_installment", true)
      .eq("is_generated_installment", false)
      .is("savings_deposit_id", null) // Exclude savings goal deposits
      .gte("date", lookbackDateStr)
      .order("date", { ascending: false });

    // Execute both queries
    const [regularResult, installmentResult] = await Promise.all([
      baseQuery.gte("date", queryStartDate).lte("date", queryEndDate).limit(200),
      installmentQuery.limit(200),
    ]);

    if (regularResult.error) {
      console.error("Regular query error:", regularResult.error);
      throw new Error("Database query failed");
    }
    if (installmentResult.error) {
      console.error("Installment query error:", installmentResult.error);
      throw new Error("Database query failed");
    }

    // Filter and project installments
    const projectedInstallments: any[] = [];
    for (const t of installmentResult.data || []) {
      const result = shouldIncludeTransaction(t, queryStartDate, queryEndDate);
      if (result.include) {
        // Add projected installment number if different from original
        projectedInstallments.push({
          ...t,
          _projectedInstallmentNumber: result.projectedInstallmentNumber || t.installment_number,
        });
      }
    }

    // Combine results, avoiding duplicates (installments in the period are in both queries)
    const regularTxIds = new Set((regularResult.data || []).map(t => t.id));
    const uniqueProjectedInstallments = projectedInstallments.filter(t => !regularTxIds.has(t.id));
    
    // Also include regular installments from the period that might not have projection
    const regularInstallments = (regularResult.data || []).filter(t => t.is_installment);
    const regularNonInstallments = (regularResult.data || []).filter(t => !t.is_installment);
    
    // For regular installments in period, add their projection info
    const regularInstallmentsWithProjection = regularInstallments.map(t => {
      const result = shouldIncludeTransaction(t, queryStartDate, queryEndDate);
      return {
        ...t,
        _projectedInstallmentNumber: result.projectedInstallmentNumber || t.installment_number,
      };
    });

    // Combine all transactions
    const txList = [
      ...regularNonInstallments,
      ...regularInstallmentsWithProjection,
      ...uniqueProjectedInstallments,
    ];
    
    let count = txList.length;
    let total = 0;

    // Determine if we're filtering by a specific person
    const personFilterValue = filters.pessoa && filters.pessoa.length === 1 ? filters.pessoa[0] : undefined;

    if (filters.metrica === "soma" || !filters.metrica) {
      total = txList.reduce((sum, t) => sum + getPersonValue(t, personFilterValue), 0);
    } else if (filters.metrica === "media") {
      total = count > 0 ? txList.reduce((sum, t) => sum + getPersonValue(t, personFilterValue), 0) / count : 0;
    } else if (filters.metrica === "max") {
      total = Math.max(...txList.map(t => getPersonValue(t, personFilterValue)), 0);
    } else if (filters.metrica === "min") {
      total = count > 0 ? Math.min(...txList.map(t => getPersonValue(t, personFilterValue))) : 0;
    } else if (filters.metrica === "contagem") {
      total = count;
    }

    // Group by if needed, using correct values for installments and split rules
    let groupedData: Record<string, number> | null = null;
    if (filters.agrupar_por) {
      groupedData = {};
      for (const t of txList) {
        let key: string;
        if (filters.agrupar_por === "instituicao") {
          key = (t as any).banks?.name || "Sem banco";
        } else if (filters.agrupar_por === "forma_pagamento") {
          key = (t as any).payment_methods?.name || "Sem forma de pagamento";
        } else {
          key = (t as any)[filters.agrupar_por] || "Sem categoria";
        }
        groupedData[key] = (groupedData[key] || 0) + getPersonValue(t, personFilterValue);
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
        value: getTransactionValue(t),
        category: t.category,
        for_who: t.for_who,
        bank_name: (t as any).banks?.name,
        payment_method: (t as any).payment_methods?.name,
        is_installment: t.is_installment,
        installment_info: t.is_installment 
          ? `${(t as any)._projectedInstallmentNumber || t.installment_number}/${t.total_installments}` 
          : null,
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
        value: getTransactionValue(t),
        category: t.category,
        subcategory: t.subcategory,
        for_who: t.for_who,
        paid_by: t.paid_by,
        bank_name: (t as any).banks?.name,
        payment_method: (t as any).payment_methods?.name,
        is_installment: t.is_installment,
        installment_number: (t as any)._projectedInstallmentNumber || t.installment_number,
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
