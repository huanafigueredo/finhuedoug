// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Converte Uint8Array para base64 com chunks mais curtos para evitar travamentos de buffer do deno
function uint8ToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

interface Category { id: string; name: string; }
interface Bank { id: string; name: string; }
interface PaymentMethod { id: string; name: string; }

serve(async (req: Request) => {
    // Tratamento CORS
    if (req.method === "OPTIONS") { return new Response(null, { headers: corsHeaders }); }

    console.log("==== WEBHOOK RECEBEU REQUISIÇÃO ====", req.method);

    try {
        const body = await req.json();
        console.log("CORPO RECEBIDO DO TELEGRAM:", JSON.stringify(body, null, 2));

        // Verifica se é um evento válido do Telegram
        if (!body.message && !body.channel_post) {
             console.log("IGNORANDO: Não tem message nem channel_post");
             return new Response("OK", { status: 200, headers: corsHeaders });
        }
        
        const message = body.message || body.channel_post;

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
        
        // Identificar usuário dono. Note que reusamos DEFAULT_WHATSAPP_USER_ID, mas vc pode criar outra "DEFAULT_TELEGRAM_USER_ID".
        const userId = Deno.env.get("DEFAULT_TELEGRAM_USER_ID") || Deno.env.get("DEFAULT_WHATSAPP_USER_ID") || Deno.env.get("SUPABASE_USER_ID");

        if (!apiKey || !supabaseUrl || !supabaseKey || !userId || !botToken) {
            console.error("Faltam variáveis de ambiente críticas: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, DEFAULT_WHATSAPP_USER_ID");
            // Retorna 200 pro Telegram não ficar executando infinite retries e banir o IP deles
            return new Response("OK", { status: 200, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let messageText = message.text || message.caption || "";
        let base64Image = null;

        // Extraindo imagem, se houver, baixando a URL privada da API nativa do Telegram
        if (message.photo && message.photo.length > 0) {
            console.log("Baixando imagem do Telegram...");
            // O último item do array photo é sempre a de maior resolução enviada pelo aparelho
            const highestResPhoto = message.photo[message.photo.length - 1];
            const fileId = highestResPhoto.file_id;

            // 1. Pegar o `file_path`
            const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            const fileInfo = await fileInfoRes.json();
            
            if (fileInfo.ok) {
                const filePath = fileInfo.result.file_path;
                
                // 2. Baixar a imagem binária real
                const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
                const arrayBuffer = await imageRes.arrayBuffer();
                
                // 3. Converter a resposta binária para base64 (Formato que o Gemini obriga passar anexado)
                base64Image = uint8ToBase64(new Uint8Array(arrayBuffer));
                console.log("Imagem recebida e codificada.");
            } else {
                console.error("Erro ao pegar info da imagem: ", fileInfo.description);
            }
        }

        if (!messageText && !base64Image) {
            console.log("A mensagem era vazia ou não continha midia útil ou de foto.");
            return new Response("OK", { status: 200, headers: corsHeaders });
        }

        console.log("Iniciando IA do Gemini... Texto capturado:", messageText);

        const { data: userSettings } = await supabase
            .from("user_settings")
            .select("person_1_name, person_2_name")
            .eq("user_id", userId)
            .single();
        
        const person1Name = userSettings?.person_1_name || "Huana";
        const person2Name = userSettings?.person_2_name || "Douglas";

        const { data: categories } = await supabase.from("categories").select("id, name");
        const { data: banks } = await supabase.from("banks").select("id, name");
        const { data: paymentMethods } = await supabase.from("payment_methods").select("id, name");

        const categoryNames = categories?.map((c: Category) => c.name).join(", ") || "";
        const bankNames = banks?.map((b: Bank) => b.name).join(", ") || "";
        const paymentMethodNames = paymentMethods?.map((pm: PaymentMethod) => pm.name).join(", ") || "";
        const currentDate = new Date().toISOString().split("T")[0];

        const promptParams = `Você é um assistente financeiro de elite do casal ${person1Name} e ${person2Name}.
Os dois moram juntos e enviam mensagens ou fotos de notas fiscais pelo Telegram para automatizar os preenchimentos exatos do sistema financeiro deles.
Sua única função é extrair TUDO do comprovante e da mensagem, deduzindo inteligentemente, e retornar ESTRITAMENTE um objeto JSON limpo (sem markdown).

Hoje é dia: ${currentDate}. (Use esta data APENAS se não houver data impressa na foto/cupom).
Mensagem original: "${messageText}"

REGRAS RÍGIDAS DE EXTRAÇÃO VISUAL:
- Data: Procure ativamente a data e hora informadas no cupom fiscal/recibo. Formate no padrão YYYY-MM-DD.
- Descrição: Capture o Nome Fantasia da loja impresso no topo da nota (ex: Giassi Supermercados).
- Observação: Se for mercado/restaurante, liste resumidamente os 3 itens mais caros ou o propósito da compra.
- Quem Pagou / Banco: Deduzir buscando por nomes (ex: cartão Mastercard final 1234, débito Nubank). Tente cruzar a bandeira/banco visto com: [${bankNames}]. Se não souber, retorne nulo.
- Forma de Pagamento: Leia a seção de pagamentos (Cartão de Crédito, Débito, PIX, Dinheiro). Ligue exatamente à lista: [${paymentMethodNames}].
- Parcelado: Se a nota acusar (Ex: Parc 1/3, 2x), extraia o número de parcelas. Senão false.
- Para Quem / Compra do Casal: Compras em mercado, farmácia, padaria, iFood geralmente são "Casal" (is_couple = true). Roupas, salão, etc., tendem a ser individuais.
- Valor Total: Extraia o valor MÁXIMO (Valor a Pagar/Total) após descontos.

MOLDE DO JSON OBRIGATÓRIO:
{
    "date": "YYYY-MM-DD",
    "description": "Nome da loja/estabelecimento limpo",
    "observacao": "Resumo inteligente",
    "type": "expense",
    "total_value": 00.00 (decimal inglês, ex: 125.50),
    "category": "Exatamente da lista: [${categoryNames}]",
    "subcategory": "Curta ou null",
    "paid_by": "Exatamente da lista: ['${person1Name}', '${person2Name}', ou null]",
    "for_who": "Exatamente da lista: ['${person1Name}', '${person2Name}', 'Casal']",
    "is_couple": true (se for para o 'Casal') ou falso,
    "bank_name": "Da lista: [${bankNames}] ou null",
    "payment_method_name": "Da lista: [${paymentMethodNames}] ou null",
    "is_installment": true ou false,
    "total_installments": número inteiro (ex: 2) ou null
}`;

        const parts: any[] = [{ text: promptParams }];
        if (base64Image) {
             parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } });
        }

        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro-vision"
        ];

        let aiResponse;
        let lastErrorText = "";

        for (const model of modelsToTry) {
            console.log(`Tentando modelo: ${model}...`);
            aiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

            if (aiResponse.ok) {
                console.log(`Modelo ${model} funcionou com sucesso!`);
                break;
            } else {
                lastErrorText = await aiResponse.text();
                console.warn(`Erro no modelo ${model}:`, lastErrorText);
            }
        }

        if (!aiResponse || !aiResponse.ok) {
            console.error("Gemini Error Final (Todos os modelos falharam):", lastErrorText);
            return new Response("OK", { status: 200, headers: corsHeaders }); 
        }

        const data = await aiResponse.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        const jsonMatch = textResponse?.match(/\{[\s\S]*\}/);
        const cleanedJson = jsonMatch ? jsonMatch[0] : "{}";
        const parsedTx = JSON.parse(cleanedJson);

        console.log("IA Terminou! JSON gerado:", parsedTx);

        const bankId = banks?.find((b: Bank) => b.name === parsedTx.bank_name)?.id || null;
        const paymentMethodId = paymentMethods?.find((pm: PaymentMethod) => pm.name === parsedTx.payment_method_name)?.id || null;
        const total = Number(parsedTx.total_value) || 0;
        const valuePerPerson = parsedTx.is_couple ? (total / 2) : total;

        const transactionObj = {
            user_id: userId,
            date: parsedTx.date || currentDate,
            description: parsedTx.description || "Transação via Tlg",
            observacao: parsedTx.observacao || null,
            type: "expense",
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
            installment_number: 1, 
            installment_value: !!parsedTx.is_installment ? (total / Math.max(1, Number(parsedTx.total_installments))) : total,
            is_generated_installment: false,
        };

        const { error: insertError } = await supabase
            .from("transactions")
            .insert(transactionObj);

        if (insertError) {
             console.error("Supabase fail insert:", insertError.message);
             // Avisa o erro no Telegram se der problema no banco
             await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: message.chat.id,
                    text: `❌ Erro ao salvar no banco: ${insertError.message}`
                })
            });
        } else {
             console.log("SUCESSO ABSOLUTO! O banco registrou:", transactionObj.description);
             
             // Manda a confirmação linda para o usuário
             const dataFormatada = new Date(transactionObj.date).toLocaleDateString('pt-BR');
             await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: message.chat.id,
                    text: `✅ *Lançamento Realizado!*\n\n🛒 *Local:* ${transactionObj.description}\n💰 *Valor:* R$ ${transactionObj.total_value.toFixed(2).replace('.', ',')}\n📅 *Data:* ${dataFormatada}\n👤 *Pago por:* ${transactionObj.paid_by || 'Não identificado'}\n\n_Já está disponível no seu site!_`,
                    parse_mode: "Markdown"
                })
            });
        }
        
        // Retorna silenciosamente "OK" ao Telegram
        return new Response("OK", { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error("Catastrophic Fallback:", error);
        return new Response("OK", { status: 200, headers: corsHeaders });
    }
});
