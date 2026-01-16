import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = [
  'https://zpkiayaliicipxcjetqh.lovableproject.com',
  'https://id-preview--zpkiayaliicipxcjetqh.lovable.app',
  'https://togetherfinancas.lovable.app',
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

interface TransacaoExtraida {
  data: string;
  descricao: string;
  valor: number;
  categoria_sugerida?: string;
  parcela_atual?: number;
  parcela_total?: number;
  tipo: "despesa" | "receita";
}

interface FaturaExtraidaResponse {
  banco_cartao: string;
  periodo_fatura: string;
  valor_total: number;
  transacoes: TransacaoExtraida[];
}

// Helper function to extract year from periodo_fatura string
function extractYearFromPeriodo(periodo: string): string | null {
  if (!periodo) return null;
  
  // Try to find a 4-digit year in the periodo string (e.g., "15/11/2024 a 15/12/2024")
  const yearMatch = periodo.match(/\b(20\d{2})\b/g);
  if (yearMatch && yearMatch.length > 0) {
    // Return the last year found (usually the end of the period)
    return yearMatch[yearMatch.length - 1];
  }
  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Faça login para continuar.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Token inválido. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const body = await req.json();
    const { fileBase64, fileType, images, isMultipleImages } = body;

    // Validate input
    if (!fileBase64 && (!images || images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'É necessário fornecer um arquivo (JPEG, PNG ou PDF)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Iniciando extração de fatura de cartão...');
    console.log('Múltiplas imagens:', isMultipleImages ? `${images.length} imagens` : 'Não');

const systemPrompt = `Você é um assistente especializado em extrair transações de faturas de cartão de crédito e extratos bancários brasileiros.

Sua tarefa é analisar a(s) imagem(ns)/PDF e extrair:
1. Nome do banco/cartão (ex: Nubank, Itaú, Bradesco, Inter, C6, etc.)
2. Período da fatura/extrato (ex: "15/11/2024 a 15/12/2024")
3. Valor total (pode ser positivo ou negativo)
4. Lista de todas as transações com:
   - Data da transação (formato dd/mm/yyyy - ANO COMPLETO COM 4 DÍGITOS)
   - Descrição (nome do estabelecimento/serviço/pessoa)
   - Valor: O VALOR EXATO que aparece na fatura/extrato para aquela linha
   - Tipo: "receita" para ENTRADAS de dinheiro, "despesa" para SAÍDAS
   - Categoria sugerida
   - Se for parcelada, extrair parcela atual e total (ex: "AMAZON 3/10" = parcela_atual: 3, parcela_total: 10)

REGRA CRÍTICA PARA DATAS - ANO OBRIGATÓRIO:
- SEMPRE extraia o ano completo com 4 dígitos (ex: 2024, 2025, 2026)
- Procure o ano no cabeçalho da fatura, no período da fatura, ou no rodapé
- Se o período da fatura é "15/11/2024 a 15/12/2024", as transações são de 2024
- Se o período é "15/12/2024 a 15/01/2025", transações de dezembro são de 2024 e janeiro de 2025
- NUNCA retorne "XXXX" no lugar do ano - deduza o ano pelo contexto
- Se a fatura mostra apenas mês e dia, use o ano do período da fatura

REGRA CRÍTICA PARA VALORES DE COMPRAS PARCELADAS:
- O campo "valor" DEVE conter o valor da PARCELA MENSAL, NÃO o valor total da compra
- Extraia EXATAMENTE o valor que está escrito na linha da fatura
- Exemplo: Se aparece "RENNER 1/3 R$ 193,20", o valor é 193.20 (a parcela)
- NÃO multiplique ou calcule o valor total - o sistema fará isso automaticamente
- Se a fatura mostra "LOJA X 2/5 R$ 100,00", retorne valor: 100.00, parcela_atual: 2, parcela_total: 5

IDENTIFICAÇÃO DE ENTRADAS (tipo: "receita"):
- Valores com "+" na frente (ex: "+ R$ 1.300,00")
- Textos como "Recebido", "Transferência recebida", "Pix recebido", "Depósito"
- Cores verdes na interface do banco
- Créditos, reembolsos, estornos
- Categorias de receita: Pix, Salário, Freelancer, Reembolso, Cashback, Presentes, Juros, Investimentos, Outros Rendimentos

IDENTIFICAÇÃO DE SAÍDAS (tipo: "despesa"):
- Valores sem sinal ou com "-" na frente
- Compras, pagamentos, transferências enviadas
- Categorias de despesa: Alimentação, Transporte, Lazer, Saúde, Educação, Compras, Serviços, Assinaturas, etc.

IMPORTANTE:
- Se houver múltiplas imagens, elas são partes da MESMA fatura - combine todas as transações
- Identifique padrões de parcelas (ex: "LOJA X 2/5", "COMPRA Y PARC 3/12")
- Normalize descrições (remover códigos internos, manter nome legível)
- Valores devem ser números positivos (sem R$)
- Datas no formato dd/mm/yyyy com ano de 4 dígitos (ex: 25/12/2024)
- Ignore taxas, juros, IOF - foque nas compras/transações
- Se não conseguir ler algo, pule o item
- EVITE transações duplicadas - cada transação deve aparecer apenas uma vez`;

    // Build user content with images
    const userContent: any[] = [
      {
        type: "text",
        text: isMultipleImages 
          ? `Analise estas ${images.length} imagens que fazem parte da mesma fatura de cartão de crédito. Extraia TODAS as transações de TODAS as imagens, combinando-as em uma única lista. Identifique o banco/cartão, período e valor total.`
          : "Analise esta fatura de cartão de crédito e extraia todas as transações, informações do cartão/banco, período e valor total."
      }
    ];

    // Add images to content
    if (isMultipleImages && images && images.length > 0) {
      for (const img of images) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: img.base64.startsWith('data:') ? img.base64 : `data:${img.type || 'image/jpeg'};base64,${img.base64}`
          }
        });
      }
    } else {
      userContent.push({
        type: "image_url",
        image_url: {
          url: fileBase64.startsWith('data:') ? fileBase64 : `data:${fileType || 'image/jpeg'};base64,${fileBase64}`
        }
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extrair_fatura_cartao",
              description: "Extrai transações de uma fatura de cartão de crédito",
              parameters: {
                type: "object",
                properties: {
                  banco_cartao: { 
                    type: "string", 
                    description: "Nome do banco ou cartão" 
                  },
                  periodo_fatura: { 
                    type: "string", 
                    description: "Período da fatura (ex: 15/11/2024 a 15/12/2024)" 
                  },
                  valor_total: { 
                    type: "number", 
                    description: "Valor total da fatura em reais" 
                  },
                  transacoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        data: { type: "string", description: "Data da transação (dd/mm/yyyy)" },
                        descricao: { type: "string", description: "Descrição/estabelecimento" },
                        valor: { type: "number", description: "Valor EXATO exibido na fatura. Para compras parceladas, é o valor da PARCELA MENSAL (não o valor total da compra)" },
                        tipo: { type: "string", enum: ["despesa", "receita"], description: "despesa para saídas, receita para entradas (valores com + na frente, Pix recebido, etc)" },
                        categoria_sugerida: { type: "string", description: "Categoria sugerida" },
                        parcela_atual: { type: "number", description: "Número da parcela atual" },
                        parcela_total: { type: "number", description: "Total de parcelas" }
                      },
                      required: ["data", "descricao", "valor", "tipo"]
                    }
                  }
                },
                required: ["banco_cartao", "periodo_fatura", "valor_total", "transacoes"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extrair_fatura_cartao" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API de IA:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA insuficientes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Resposta da IA recebida');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extrair_fatura_cartao') {
      console.error('Formato de resposta inesperado:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair as transações da fatura' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: FaturaExtraidaResponse = JSON.parse(toolCall.function.arguments);
    
    // Post-process: Try to fix invalid years using periodo_fatura
    const yearFromPeriodo = extractYearFromPeriodo(result.periodo_fatura);
    console.log(`Ano extraído do período: ${yearFromPeriodo || 'não encontrado'}`);
    
    result.transacoes = result.transacoes.map(t => {
      const [day, month, year] = t.data.split('/');
      // Check if year is invalid (not 4 digits)
      if (!/^\d{4}$/.test(year)) {
        // Try to use year from periodo_fatura, or current year as last resort
        const fixedYear = yearFromPeriodo || new Date().getFullYear().toString();
        const fixedDate = `${day}/${month}/${fixedYear}`;
        console.log(`Data corrigida: ${t.data} -> ${fixedDate}`);
        return { ...t, data: fixedDate };
      }
      return t;
    });
    
    console.log(`Extração concluída: ${result.transacoes.length} transações do ${result.banco_cartao}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na extração:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
