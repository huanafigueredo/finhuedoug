// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@latest";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function uint8ToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(uint8Array[i]); }
    return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const body = await req.json();
        const message = body.message || body.channel_post || body.callback_query?.message;
        const callbackQuery = body.callback_query;

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
        const userId = Deno.env.get("DEFAULT_TELEGRAM_USER_ID") || Deno.env.get("SUPABASE_USER_ID");

        if (!apiKey || !supabaseUrl || !supabaseKey || !userId || !botToken) return new Response("Missing env", { status: 200 });

        const supabase = createClient(supabaseUrl, supabaseKey);
        const chat_id = message?.chat?.id || callbackQuery?.from?.id;
        if (!chat_id) return new Response("No chat_id", { status: 200 });

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

        async function sendMessage(text: string, replyMarkup?: any) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", reply_markup: replyMarkup })
            });
        }

        async function askNextQuestion(sessionData: any) {
            if (!sessionData.total_value) { await sendMessage("Qual o valor total da compra? (Ex: 150,50)"); return; }
            if (!sessionData.for_who) {
                await sendMessage("Para quem é esse gasto?", {
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
                await sendMessage("Qual banco/cartão foi utilizado?", { inline_keyboard: bankButtons });
                return;
            }
            if (!sessionData.payment_method_id) {
                const methodButtons = paymentMethods?.map(pm => [{ text: pm.name, callback_data: `set_method:${pm.id}` }]) || [];
                await sendMessage("Qual a forma de pagamento?", { inline_keyboard: methodButtons });
                return;
            }
            if (sessionData.is_installment === undefined) {
                await sendMessage("A compra foi parcelada?", {
                    inline_keyboard: [[
                        { text: "À Vista 💰", callback_data: "set_installment:false" },
                        { text: "Parcelada 💳", callback_data: "set_installment:true" }
                    ]]
                });
                return;
            }
            if (sessionData.is_installment && (!sessionData.total_installments || sessionData.total_installments <= 1)) {
                await sendMessage("Em quantas parcelas? (Envie apenas o número)");
                return;
            }
            if (sessionData.base64Image && sessionData.save_receipt === undefined) {
                await sendMessage("📸 Deseja salvar a foto da nota fiscal no site?", {
                    inline_keyboard: [[
                        { text: "Sim, Salvar ✅", callback_data: "set_save_receipt:true" },
                        { text: "Não ❌", callback_data: "set_save_receipt:false" }
                    ]]
                });
                return;
            }
            await finalizeTransaction(sessionData);
        }

        async function finalizeTransaction(data: any) {
            const total = Number(data.total_value);
            const valuePerPerson = data.for_who === "Casal" ? (total / 2) : total;
            const transactionObj = {
                user_id: userId, account_id: accountId, date: data.date || new Date().toISOString().split("T")[0],
                description: data.description || "Transação via Tlg", observacao: data.observacao || null,
                type: "expense", total_value: total, value_per_person: valuePerPerson, category: data.category || "Outros",
                is_couple: data.for_who === "Casal", paid_by: data.paid_by || (data.for_who !== "Casal" ? data.for_who : null),
                for_who: data.for_who, bank_id: data.bank_id, payment_method_id: data.payment_method_id,
                is_installment: !!data.is_installment, total_installments: Number(data.total_installments) || 1,
            };

            const { data: tx, error } = await supabase.from("transactions").insert(transactionObj).select().single();
            if (error) { await sendMessage(`❌ Erro: ${error.message}`); return; }

            if (data.save_receipt && data.base64Image && tx) {
                const fileName = `${userId}/${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, base64ToUint8(data.base64Image), { contentType: 'image/jpeg' });
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('comprovantes').getPublicUrl(fileName);
                    await supabase.from("comprovantes_lancamento").insert({ lancamento_id: tx.id, user_id: userId, file_url: publicUrl, file_name: fileName, file_type: 'image/jpeg' });
                }
            }
            await sendMessage(`✅ *Lançamento Realizado!*\n\n🛒 *Local:* ${transactionObj.description}\n💰 *Valor:* R$ ${transactionObj.total_value.toFixed(2)}`);
            await supabase.from("telegram_sessions").delete().eq("chat_id", chat_id.toString());
        }

        // --- CALLBACK QUERIES ---
        if (callbackQuery) {
            const [action, value] = callbackQuery.data.split(":");
            const { data: s } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chat_id.toString()).single();
            if (!s) return new Response("OK");
            const updated = { ...s.data };
            if (action === "set_for_who") { updated.for_who = value; if (value !== "Casal") updated.paid_by = value; }
            else if (action === "set_bank") updated.bank_id = value;
            else if (action === "set_method") updated.payment_method_id = value;
            else if (action === "set_installment") updated.is_installment = value === "true";
            else if (action === "set_save_receipt") updated.save_receipt = value === "true";

            await supabase.from("telegram_sessions").update({ data: updated }).eq("chat_id", chat_id.toString());
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: callbackQuery.id }) });
            await askNextQuestion(updated);
            return new Response("OK");
        }

        // --- MENSAGENS ---
        const { data: activeSession } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chat_id.toString()).single();
        if (activeSession) {
            const text = message.text || "";
            const num = parseFloat(text.replace(',', '.'));
            if (!isNaN(num)) {
                const updated = { ...activeSession.data };
                if (!updated.total_value) updated.total_value = num;
                else if (updated.is_installment && (!updated.total_installments || updated.total_installments <= 1)) updated.total_installments = Math.round(num);
                await supabase.from("telegram_sessions").update({ data: updated }).eq("chat_id", chat_id.toString());
                await askNextQuestion(updated);
                return new Response("OK");
            }
        }

        let messageText = message.text || message.caption || "";
        let base64Image = null;
        if (message.photo) {
            const fileId = message.photo[message.photo.length - 1].file_id;
            const fRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`).then(r => r.json());
            if (fRes.ok) {
                const img = await fetch(`https://api.telegram.org/file/bot${botToken}/${fRes.result.file_path}`);
                base64Image = uint8ToBase64(new Uint8Array(await img.arrayBuffer()));
            }
        }

        if (!messageText && !base64Image) return new Response("OK");
        await sendMessage("🤖 Processando com SDK Oficial...");

        const prompt = `Extraia dados financeiros desta mensagem/imagem. REGRAS OBSERVAÇÃO: Se nota fiscal, liste TODOS os itens. JSON: {
            "date": "YYYY-MM-DD", "description": "local", "total_value": 0.00, "category": "uma de: [${categories?.map(c=>c.name).join(", ")}]",
            "observacao": "itens...", "for_who": "null ou nome", "bank_name": "null ou nome", "payment_method_name": "null ou nome", "is_installment": bool
        }`;

        const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
        let resultText = "";

        for (const mName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: mName });
                const parts = [{ text: prompt }];
                if (base64Image) parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
                if (messageText) parts.push({ text: `Texto extra: ${messageText}` });

                const result = await model.generateContent(parts);
                const response = await result.response;
                resultText = response.text();
                if (resultText) break;
            } catch (e) { console.error(`Erro no modelo ${mName}:`, e); }
        }

        if (!resultText) { await sendMessage("⚠️ Erro na IA. Tente novamente."); return new Response("OK"); }

        const parsed = JSON.parse(resultText.match(/\{[\s\S]*\}/)?.[0] || "{}");
        const fBank = banks?.find(b => b.name.toLowerCase().includes(parsed.bank_name?.toLowerCase()));
        const fMethod = paymentMethods?.find(pm => pm.name.toLowerCase().includes(parsed.payment_method_name?.toLowerCase()));

        const sessionData = { ...parsed, bank_id: fBank?.id, payment_method_id: fMethod?.id, base64Image };
        await supabase.from("telegram_sessions").upsert({ chat_id: chat_id.toString(), user_id: userId, data: sessionData });
        await askNextQuestion(sessionData);
        return new Response("OK");

    } catch (e) { console.error(e); return new Response("OK"); }
});
