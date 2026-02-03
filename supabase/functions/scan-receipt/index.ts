// @ts-nocheck

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to handle image data with or without base64 prefix
function normalizeBase64(image) {
    if (image.startsWith("data:")) {
        return image.split(",")[1];
    }
    return image;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { image } = await req.json();

        if (!image) {
            throw new Error("No image data provided");
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not set in Supabase Secrets");
        }

        const base64Data = normalizeBase64(image);
        console.log(`Incoming image size: ${Math.round(base64Data.length / 1024)} KB`);

        const prompt = `Você é um assistente especializado em finanças pessoais.
Analise a imagem deste cupom fiscal e extraia as seguintes informações em formato JSON:
1. "total_value": Valor total da compra como número.
2. "date": Data da compra no formato YYYY-MM-DD.
3. "merchant_name": Nome do estabelecimento/loja (ex: Giassi Supermercados). Tente capitalizar corretamente.
4. "category": Categoria sugerida para a despesa (ex: Mercado, Restaurante, Farmácia).
5. "items": Lista de produtos contendo:
    - "nome": Nome do produto.
    - "quantidade": Quantidade (pode ser decimal).
    - "valor": Valor unitário ou total do item.
    - "categoria": Departamento do item (ex: Padaria, Limpeza, Açougue).
6. "tags": Lista de até 5 tags curtas sobre a compra.
7. "summary": Um resumo de uma linha sobre a compra.

IMPORTANTE: Retorne APENAS o JSON puro, sem markdown ou explicações. Se não encontrar algo, retorne null no campo.`;

        console.log("Calling Gemini API (gemini-1.5-flash-002)...");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: base64Data,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error Status:", response.status);
            console.error("Gemini API Error Detail:", JSON.stringify(data));

            // Structured error for frontend
            return new Response(JSON.stringify({
                error: (data.error?.message || "Internal AI Error"),
                code: response.status,
                type: "AI_API_ERROR"
            }), {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            console.error("Gemini returned empty text response:", JSON.stringify(data));
            throw new Error("AI returned empty result");
        }

        // Locate the JSON block using a regex that finds the first '{' and the last '}'
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : textResponse;

        try {
            const result = JSON.parse(cleanedJson);
            console.log("Extraction successful for:", result.merchant_name);
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } catch (parseError) {
            console.error("JSON Parse Error. Content received:", textResponse);
            return new Response(JSON.stringify({
                error: "IA respondeu em formato inválido",
                detail: cleanedJson.substring(0, 100),
                type: "PARSE_ERROR"
            }), {
                status: 422,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

    } catch (error) {
        console.error("Global Function Error:", error.message);
        return new Response(JSON.stringify({
            error: error.message,
            type: "INTERNAL_ERROR"
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
