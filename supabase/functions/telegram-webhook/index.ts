// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    let botToken = "";
    let chat_id = null;

    async function sendMessage(text: string, replyMarkup?: any) {
        if (!botToken || !chat_id) return;
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", reply_markup: replyMarkup })
            });
        } catch (e) {
            console.error("Erro ao enviar mensagem:", e);
        }
    }

    async function sendChatAction(action: string) {
        if (!botToken || !chat_id) return;
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id, action })
            });
        } catch (e) {
            console.error("Erro ao enviar chat action:", e);
        }
    }

    try {
        const body = await req.json();
        const message = body.message || body.channel_post || body.callback_query?.message;
        const callbackQuery = body.callback_query;

        const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
        if (!apiKey) console.error("CHAVE NÃO ENCONTRADA NO AMBIENTE");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
        const userId = Deno.env.get("DEFAULT_TELEGRAM_USER_ID") || Deno.env.get("SUPABASE_USER_ID");

        if (!apiKey || !supabaseUrl || !supabaseKey || !userId || !botToken) return new Response("Missing env", { status: 200 });

        const supabase = createClient(supabaseUrl, supabaseKey);
        chat_id = message?.chat?.id || callbackQuery?.from?.id;
        if (!chat_id) return new Response("No chat_id", { status: 200 });

        try {
            // === 1. CONFIGURAÇÃO DA IA (SDK OFICIAL) ===
            const genAI = new GoogleGenerativeAI(apiKey);

            // === DADOS DE APOIO ===
            const [{ data: profile }, { data: userSettings }, { data: banks }, { data: paymentMethods }, { data: categories }] = await Promise.all([
                supabase.from("profiles").select("account_id").eq("id", userId).single(),
                supabase.from("user_settings").select("person_1_name, person_2_name").eq("user_id", userId).single(),
                supabase.from("banks").select("id, name"),
                supabase.from("payment_methods").select("id, name"),
                supabase.from("categories").select("name")
            ]);

            const person1Name = userSettings?.person_1_name || "Huana";
            const person2Name = userSettings?.person_2_name || "Douglas";
            const accountId = profile?.account_id;

            async function askNextQuestion(sessionData: any) {
                if (!sessionData.description || sessionData.description === "null") {
                    await sendMessage("📝 Qual a descrição deste gasto? *(Ex: Supermercado, Aluguel, Cinema...)*");
                    return;
                }
                if (!sessionData.total_value || sessionData.total_value === "null") {
                    await sendMessage("💳 Qual foi o valor total desta despesa? *(Ex: 150,50)*");
                    return;
                }
                if (!sessionData.category || sessionData.category === "null" || sessionData.category === "Outros") {
                    const categoryButtons = categories?.map(c => [{ text: c.name, callback_data: `set_category:${c.name}` }]) || [];
                    await sendMessage("📂 Em qual categoria esse gasto se encaixa?", { inline_keyboard: categoryButtons });
                    return;
                }
                if (!sessionData.for_who || sessionData.for_who === "null") {
                    await sendMessage("👤 Para quem foi direcionado este gasto?", {
                        inline_keyboard: [[
                            { text: person1Name, callback_data: `set_for_who:${person1Name}` },
                            { text: person2Name, callback_data: `set_for_who:${person2Name}` },
                            { text: "Casal 🏠", callback_data: "set_for_who:Casal" }
                        ]]
                    });
                    return;
                }
                if (!sessionData.bank_id) {
                    const bankButtons = banks?.map(b => [{ text: b.name, callback_data: `set_bank:${b.id}` }]) || [];
                    await sendMessage("🏦 Em qual banco ou cartão essa despesa foi registrada?", { inline_keyboard: bankButtons });
                    return;
                }
                if (!sessionData.payment_method_id) {
                    const methodButtons = paymentMethods?.map(pm => [{ text: pm.name, callback_data: `set_method:${pm.id}` }]) || [];
                    await sendMessage("💸 Qual foi a forma de pagamento utilizada?", { inline_keyboard: methodButtons });
                    return;
                }
                if (sessionData.is_installment === undefined) {
                    await sendMessage("💳 Como foi o pagamento?", {
                        inline_keyboard: [[
                            { text: "À Vista 💰", callback_data: "set_installment:false" },
                            { text: "Parcelada 💳", callback_data: "set_installment:true" }
                        ]]
                    });
                    return;
                }
                if (sessionData.is_installment && (!sessionData.total_installments || sessionData.total_installments <= 1)) {
                    await sendMessage("🔢 Em quantas parcelas foi dividido? *(Envie apenas o número, ex: 3)*");
                    return;
                }
                if (sessionData.base64Image && sessionData.save_receipt === undefined) {
                    await sendMessage("📸 Gostaria de arquivar a foto do comprovante com o lançamento?", {
                        inline_keyboard: [[
                            { text: "Sim, arquivar ✅", callback_data: "set_save_receipt:true" },
                            { text: "Não precisa ❌", callback_data: "set_save_receipt:false" }
                        ]]
                    });
                    return;
                }
                await finalizeTransaction(sessionData);
            }

            async function finalizeTransaction(data: any) {
                await sendChatAction("typing");
                const total = Number(data.total_value);
                const valuePerPerson = data.for_who === "Casal" ? (total / 2) : total;
                const transactionObj = {
                    user_id: userId, account_id: accountId, date: (data.date && data.date !== "null") ? data.date : new Date().toISOString().split("T")[0],
                    description: data.description || "Lançamento via Assistente", observacao: data.observacao || null,
                    type: "expense", total_value: total, value_per_person: valuePerPerson, category: data.category || "Outros",
                    is_couple: data.for_who === "Casal", paid_by: data.paid_by || (data.for_who !== "Casal" ? data.for_who : null),
                    for_who: data.for_who, bank_id: data.bank_id, payment_method_id: data.payment_method_id,
                    is_installment: !!data.is_installment, total_installments: Number(data.total_installments) || 1,
                };

                const { data: tx, error } = await supabase.from("transactions").insert(transactionObj).select().single();
                if (error) { await sendMessage(`❌ Ocorreu um problema ao salvar: ${error.message}`); return; }

                if (data.save_receipt && data.base64Image && tx) {
                    const fileName = `${userId}/${Date.now()}.jpg`;
                    const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, base64Decode(data.base64Image), { contentType: 'image/jpeg' });
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('comprovantes').getPublicUrl(fileName);
                        await supabase.from("comprovantes_lancamento").insert({ lancamento_id: tx.id, user_id: userId, file_url: publicUrl, file_name: fileName, file_type: 'image/jpeg' });
                    }
                }
                await sendMessage(`✅ **Tudo pronto! Seu lançamento foi registrado com sucesso.**\n\n🛒 **Detalhes:** ${transactionObj.description}\n💰 **Valor:** R$ ${transactionObj.total_value.toFixed(2)}\n\n✨ _Sempre às ordens!_`);
                await supabase.from("telegram_sessions").delete().eq("chat_id", chat_id.toString());
            }

            // --- CALLBACK QUERIES ---
            if (callbackQuery) {
                const [action, value] = callbackQuery.data.split(":");
                const { data: s } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chat_id.toString()).single();
                if (!s) return new Response("OK");
                const updated = { ...s.data };
                if (action === "set_for_who") { updated.for_who = value; if (value !== "Casal") updated.paid_by = value; }
                else if (action === "set_category") updated.category = value;
                else if (action === "set_bank") updated.bank_id = value;
                else if (action === "set_method") updated.payment_method_id = value;
                else if (action === "set_installment") updated.is_installment = value === "true";
                else if (action === "set_save_receipt") updated.save_receipt = value === "true";

                await supabase.from("telegram_sessions").update({ data: updated }).eq("chat_id", chat_id.toString());
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: callbackQuery.id }) });
                await askNextQuestion(updated);
                return new Response("OK");
            }

            // --- MENSAGENS (RESPOSTAS AOS QUESTIONAMENTOS) ---
            const { data: activeSession } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chat_id.toString()).single();
            if (activeSession) {
                const text = message.text || "";
                const updated = { ...activeSession.data };
                
                // Lógica para preencher o próximo campo vazio com base no que foi perguntado
                if (!updated.description || updated.description === "null") {
                    updated.description = text;
                } else if (!updated.total_value || updated.total_value === "null") {
                    const num = parseFloat(text.replace(',', '.'));
                    if (!isNaN(num)) updated.total_value = num;
                    else { await sendMessage("⚠️ Por favor, envie apenas o valor numérico (ex: 45.90)"); return new Response("OK"); }
                } else if (updated.is_installment && (!updated.total_installments || updated.total_installments <= 1)) {
                    const num = parseInt(text);
                    if (!isNaN(num)) updated.total_installments = num;
                    else { await sendMessage("🔢 Por favor, envie apenas o número de parcelas (ex: 12)"); return new Response("OK"); }
                }
                
                await supabase.from("telegram_sessions").update({ data: updated }).eq("chat_id", chat_id.toString());
                await askNextQuestion(updated);
                return new Response("OK");
            }

            let messageText = message.text || message.caption || "";
            let base64Image = null;
            if (message.photo) {
                const fileId = message.photo[message.photo.length - 1].file_id;
                const fRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`).then(r => r.json());
                if (fRes.ok) {
                    const img = await fetch(`https://api.telegram.org/file/bot${botToken}/${fRes.result.file_path}`);
                    base64Image = base64Encode(new Uint8Array(await img.arrayBuffer()));
                }
            }

            if (!messageText && !base64Image) return new Response("OK");

            // Feedback imediato e status de digitando
            await sendChatAction("typing");
            await sendMessage("✨ Recebi sua mensagem! Analisando os detalhes para você, só um instante...");

            const prompt = `Extraia dados financeiros desta mensagem/imagem. REGRAS OBSERVAÇÃO: Se nota fiscal, liste TODOS os itens. JSON: {
                "date": "YYYY-MM-DD", "description": "local", "total_value": 0.00, "category": "uma de: [${categories?.map(c => c.name).join(", ")}]",
                "observacao": "itens...", "for_who": "null ou nome", "bank_name": "null ou nome", "payment_method_name": "null ou nome", "is_installment": bool
            }`;

            const models = [
                "gemini-2.5-flash",
                "gemini-flash-latest",
                "gemini-2.5-pro",
                "gemini-pro-latest"
            ];
            let resultText = "";
            let lastError = "";

            for (const mName of models) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: mName,
                        generationConfig: { responseMimeType: "application/json" }
                    });
                    const parts = [{ text: prompt }];
                    if (base64Image) parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
                    if (messageText) parts.push({ text: `Texto extra: ${messageText}` });

                    const result = await model.generateContent(parts);
                    const response = await result.response;
                    resultText = response.text();
                    if (resultText) break;
                } catch (e) {
                    console.error(`Erro no modelo ${mName}:`, e);
                    lastError = e.message || String(e);
                }
            }

            if (!resultText) {
                await sendMessage(`⚠️ Poxa, não consegui ler os dados automaticamente dessa vez.\n\n*(Erro técnico: ${lastError})*\n\nPoderia tentar de novo ou enviar as informações em texto? 😅`);
                return new Response("OK");
            }

            const parsed = JSON.parse(resultText.match(/\{[\s\S]*\}/)?.[0] || "{}");
            const fBank = banks?.find(b => b.name.toLowerCase().includes(parsed.bank_name?.toLowerCase()));
            const fMethod = paymentMethods?.find(pm => pm.name.toLowerCase().includes(parsed.payment_method_name?.toLowerCase()));

            const sessionData = { ...parsed, bank_id: fBank?.id, payment_method_id: fMethod?.id, base64Image };
            await supabase.from("telegram_sessions").upsert({ chat_id: chat_id.toString(), user_id: userId, data: sessionData });
            await askNextQuestion(sessionData);
            return new Response("OK");

        } catch (innerError) {
            console.error("Erro interno ao processar requisição:", innerError);
            await sendMessage("Desculpe, tive um pequeno contratempo técnico ao processar sua solicitação. Poderia tentar novamente em alguns instantes? 🛠️");
            return new Response("OK");
        }

    } catch (e) {
        console.error("Erro global no webhook:", e);
        return new Response("OK");
    }
});
