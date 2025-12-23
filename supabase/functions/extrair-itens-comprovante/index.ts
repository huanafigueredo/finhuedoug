import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface ExtractedItem {
  nome: string;
  quantidade?: number;
  valor?: number;
  categoria?: string;
}

interface ExtractionResult {
  itens: ExtractedItem[];
  tags_sugeridas: string[];
  resumo_curto: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, nfeQrUrl, fileType } = await req.json();

    if (!imageBase64 && !nfeQrUrl) {
      return new Response(
        JSON.stringify({ error: 'É necessário fornecer uma imagem ou URL do QR Code' }),
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

    console.log('Iniciando extração de itens...');
    console.log('Tipo de entrada:', nfeQrUrl ? 'QR Code NFC-e' : `Arquivo ${fileType}`);

    const systemPrompt = `Você é um assistente especializado em extrair informações de notas fiscais de supermercado/mercado brasileiro.
    
Sua tarefa é analisar a imagem/documento fornecido e extrair:
1. Lista de itens comprados (nome, quantidade quando disponível, valor quando disponível)
2. Tags por departamento (máximo 5) - exemplos: hortifruti, açougue, padaria, limpeza, higiene, bebidas, pet, bebê, laticínios, frios, congelados, mercearia
3. Um resumo curto da compra (máximo 100 caracteres)

IMPORTANTE:
- As tags devem ser por DEPARTAMENTO, não por item individual
- Agrupe itens similares mentalmente para determinar os departamentos
- Normalize os nomes dos itens (maiúsculas/minúsculas adequadas)
- Se não conseguir ler algo, indique com "?"
- Retorne APENAS JSON válido no formato especificado`;

    const userContent: any[] = [
      {
        type: "text",
        text: nfeQrUrl 
          ? `Analise esta nota fiscal eletrônica do link: ${nfeQrUrl}\n\nSe não conseguir acessar o link, indique que precisa de uma foto da nota.`
          : "Analise esta imagem de nota fiscal e extraia os itens, tags por departamento e um resumo curto."
      }
    ];

    // Add image if provided
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:${fileType || 'image/jpeg'};base64,${imageBase64}`
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
              name: "extrair_itens_nota",
              description: "Extrai itens, tags e resumo de uma nota fiscal",
              parameters: {
                type: "object",
                properties: {
                  itens: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string", description: "Nome do item" },
                        quantidade: { type: "number", description: "Quantidade comprada" },
                        valor: { type: "number", description: "Valor do item em reais" },
                        categoria: { type: "string", description: "Departamento do item" }
                      },
                      required: ["nome"]
                    }
                  },
                  tags_sugeridas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Tags de departamento (máximo 5)"
                  },
                  resumo_curto: {
                    type: "string",
                    description: "Resumo da compra (máximo 100 caracteres)"
                  }
                },
                required: ["itens", "tags_sugeridas", "resumo_curto"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extrair_itens_nota" } }
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

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extrair_itens_nota') {
      console.error('Formato de resposta inesperado:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair os itens da nota' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ExtractionResult = JSON.parse(toolCall.function.arguments);
    
    // Ensure tags are limited to 5
    if (result.tags_sugeridas.length > 5) {
      result.tags_sugeridas = result.tags_sugeridas.slice(0, 5);
    }

    // Ensure resumo_curto is not too long
    if (result.resumo_curto && result.resumo_curto.length > 100) {
      result.resumo_curto = result.resumo_curto.substring(0, 97) + '...';
    }

    console.log(`Extração concluída: ${result.itens.length} itens, ${result.tags_sugeridas.length} tags`);

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
