// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: Converter base64 da imagem
function normalizeBase64(image: string) {
    if (image.startsWith("data:")) {
        return image.split(",")[1];
    }
    return image;
}

serve(async (req: any) => {
    // Tratamento CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // Identificar usuário dono (fallback estático ou pegado do banco)
        const userId = Deno.env.get("DEFAULT_WHATSAPP_USER_ID");

        if (!apiKey || !supabaseUrl || !supabaseKey || !userId) {
            console.error("Faltam variáveis de ambiente críticas no Supabase (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEFAULT_WHATSAPP_USER_ID)");
            return new Response(JSON.stringify({ error: "Server Configuration Error" }), { status: 500, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const event = body.data || body;
        let messageText = "";
        let base64Image = null;

        // Processa payload para extrair texto/imagem de várias arquiteturas possíveis do webhook
        if (body.test_message) {
            messageText = body.test_message;
        } else if (event?.message?.conversation) {
            messageText = event.message.conversation;
        } else if (event?.message?.extendedTextMessage?.text) {
            messageText = event.message.extendedTextMessage.text;
        } else if (event?.message?.imageMessage) {
            messageText = event.message.imageMessage?.caption || "";
            base64Image = body.base64 || event.base64;
        } else if (body.text || body.image) {
            messageText = body.text || "";
            base64Image = body.image ? normalizeBase64(body.image) : null;
        } else {
            console.log("Ignorando payload indesejado:", JSON.stringify(body).substring(0, 100));
            return new Response("OK", { status: 200, headers: corsHeaders });
        }

        console.log("Recebida requisição... texto:", messageText);

        // Obter definições do casal e sistema do usuário
        const { data: userSettings } = await supabase
            .from("user_settings")
            .select("person_1_name, person_2_name")
            .eq("user_id", userId)
            .single();

        const person1Name = userSettings?.person_1_name || "Huana";
        const person2Name = userSettings?.person_2_name || "Douglas";

        // Obter metadados para orientar a precisão da IA
        const { data: categories } = await supabase.from("categories").select("id, name");
        const { data: banks } = await supabase.from("banks").select("id, name");
        const { data: paymentMethods } = await supabase.from("payment_methods").select("id, name");

        const categoryNames = categories?.map((c: any) => c.name).join(", ") || "";
        const bankNames = banks?.map((b: any) => b.name).join(", ") || "";
        const paymentMethodNames = paymentMethods?.map((pm: any) => pm.name).join(", ") || "";
        const currentDate = new Date().toISOString().split("T")[0];

        const promptParams = `Você é um assistente financeiro do casal ${person1Name} e ${person2Name}.
Os dois moram juntos e enviam mensagens para você registrar novos gastos no sistema deles.
Sua única função é ler a mensagem que enviaram e montar ESTRITAMENTE E ÚNICA E EXCLUSIVAMENTE um objeto JSON. Sem marcadores de código, sem blocos, só o JSON limpo.

Hoje é: ${currentDate}.
A mensagem nova é: "${messageText}"
${base64Image ? "HÁ UM COMPROVANTE ANEXADO EM IMAGEM. LEIA TAMBÉM OS DADOS DA NOTA FISCAL/IMAGEM E JUNTE COM A MENSAGEM ACIMA." : ""}

MOLDE EXATO PARA DEVOLVER:
{
    "description": "Nome do local/loja (ex: Mercado Extra) da nota",
    "observacao": "Detalhe da compra ou lista dos principais itens da nota (se for mercado).",
    "type": "expense",
    "total_value": Valor gasto formatado como número decimal estilo Americano (ex: 145.50),
    "category": "Escolha UMA DA LISTA EXATA: [${categoryNames}]",
    "subcategory": "Um nome curto ou defina nulo",
    "paid_by": "Escolha '${person1Name}' ou '${person2Name}' deduza da foto, ou passe nulo",
    "for_who": "Para quem é (Ex: '${person1Name}', '${person2Name}' ou 'Casal' se deduzir que deve ser dividido)",
    "is_couple": true (se for para o 'Casal') ou false,
    "bank_name": "Tente deduzir O EXATO BANCO DA LISTA SE SE APLICAR: [${bankNames}] ou nulo",
    "payment_method_name": "Tente deduzir DA LISTA: [${paymentMethodNames}] ou nulo",
    "is_installment": true se foi parcelado ou falso,
    "total_installments": Numero de parcelas inteiro (ex: 2) ou null
}`;

        const parts: any[] = [{ text: promptParams }];
        if (base64Image) {
            parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } });
        }

        const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 32,
                        topP: 1,
                    },
                }),
            }
        );

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error("Gemini Error:", errText);
            throw new Error("Erro na Inteligência Artificial: " + aiResponse.status);
        }

        const data = await aiResponse.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Garante que é JSON e salva
        const jsonMatch = textResponse?.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : "{}";
        const parsedTx = JSON.parse(cleanedJson);

        console.log("IA Gerou o JSON:", parsedTx);

        // Mapear campos deduzidos
        const bankId = banks?.find((b: any) => b.name === parsedTx.bank_name)?.id || null;
        const paymentMethodId = paymentMethods?.find((pm: any) => pm.name === parsedTx.payment_method_name)?.id || null;
        // Pega valor total para ser dividido
        const total = Number(parsedTx.total_value) || 0;
        const valuePerPerson = parsedTx.is_couple ? (total / 2) : total;

        const transactionObj = {
            user_id: userId,
            date: (parsedTx.date && parsedTx.date !== "null") ? parsedTx.date : currentDate,
            description: parsedTx.description || "Sem descricão via WA",
            observacao: parsedTx.observacao || null,
            type: "expense", // Mantendo expense por padrão
            total_value: total,
            value_per_person: valuePerPerson,
            category: parsedTx.category || null,
            subcategory: parsedTx.subcategory || null,
            is_couple: !!parsedTx.is_couple,
            paid_by: parsedTx.paid_by || null,
            for_who: parsedTx.for_who || null,
            bank_id: bankId,
            payment_method_id: paymentMethodId,
            is_installment: !!parsedTx.is_installment,
            total_installments: Number(parsedTx.total_installments) || 1,
            // Valores internos obrigatorios dependendo do seu backend
            installment_number: 1,
            installment_value: !!parsedTx.is_installment ? (total / Math.max(1, Number(parsedTx.total_installments))) : total,
            is_generated_installment: false,
        };

        const { error: insertError } = await supabase
            .from("transactions")
            .insert(transactionObj);

        if (insertError) {
            console.error("Supabase insert error:", insertError.message, insertError.details);
            throw new Error("Falha ao salvar a transação gerada");
        }

        console.log("Transação salva com sucesso =>", transactionObj.description);

        return new Response(JSON.stringify({ success: true, inserted: transactionObj }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Global Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
