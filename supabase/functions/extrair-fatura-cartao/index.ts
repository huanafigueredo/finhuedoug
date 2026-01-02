import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface TransacaoExtraida {
  data: string;
  descricao: string;
  valor: number;
  categoria_sugerida?: string;
  parcela_atual?: number;
  parcela_total?: number;
}

interface FaturaExtraidaResponse {
  banco_cartao: string;
  periodo_fatura: string;
  valor_total: number;
  transacoes: TransacaoExtraida[];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileType } = await req.json();

    if (!fileBase64) {
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
    console.log('Tipo de arquivo:', fileType);

    const systemPrompt = `Você é um assistente especializado em extrair transações de faturas de cartão de crédito brasileiras.

Sua tarefa é analisar a imagem/PDF da fatura e extrair:
1. Nome do banco/cartão (ex: Nubank, Itaú, Bradesco, Inter, C6, etc.)
2. Período da fatura (ex: "15/11/2024 a 15/12/2024")
3. Valor total da fatura
4. Lista de todas as transações com:
   - Data da transação (formato dd/mm/yyyy)
   - Descrição (nome do estabelecimento/serviço)
   - Valor (em reais, número positivo)
   - Categoria sugerida (alimentação, transporte, lazer, saúde, educação, compras, serviços, assinaturas, etc.)
   - Se for parcelada, extrair parcela atual e total (ex: "AMAZON 3/10" = parcela_atual: 3, parcela_total: 10)

IMPORTANTE:
- Identifique padrões de parcelas (ex: "LOJA X 2/5", "COMPRA Y PARC 3/12")
- Normalize descrições (remover códigos internos, manter nome legível)
- Valores devem ser números positivos (sem R$)
- Datas no formato dd/mm/yyyy
- Ignore taxas, juros, IOF - foque nas compras/transações
- Se não conseguir ler algo, pule o item`;

    const userContent: any[] = [
      {
        type: "text",
        text: "Analise esta fatura de cartão de crédito e extraia todas as transações, informações do cartão/banco, período e valor total."
      },
      {
        type: "image_url",
        image_url: {
          url: fileBase64.startsWith('data:') ? fileBase64 : `data:${fileType || 'image/jpeg'};base64,${fileBase64}`
        }
      }
    ];

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
                        valor: { type: "number", description: "Valor em reais (positivo)" },
                        categoria_sugerida: { type: "string", description: "Categoria sugerida" },
                        parcela_atual: { type: "number", description: "Número da parcela atual" },
                        parcela_total: { type: "number", description: "Total de parcelas" }
                      },
                      required: ["data", "descricao", "valor"]
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
