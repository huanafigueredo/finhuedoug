// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
        const userId = Deno.env.get("DEFAULT_TELEGRAM_USER_ID") || Deno.env.get("DEFAULT_WHATSAPP_USER_ID") || Deno.env.get("SUPABASE_USER_ID");

        if (!apiKey || !supabaseUrl || !supabaseKey || !userId || !botToken) return new Response("Missing env", { status: 200 });

        const supabase = createClient(supabaseUrl, supabaseKey);
        const chat_id = message?.chat?.id || callbackQuery?.from?.id;
        if (!chat_id) return new Response("No chat_id", { status: 200 });

        const [{ data: profile }, { data: userSettings }, { data: banks }, { data: paymentMethods }] = await Promise.all([
            supabase.from("profiles").select("account_id").eq("id", userId).single(),
            supabase.from("user_settings").select("person_1_name, person_2_name").eq("user_id", userId).single(),
            supabase.from("banks").select("id, name"),
            supabase.from("payment_methods").select("id, name")
        ]);

        const person1Name = userSettings?.person_1_name || "Huana";
        const person2Name = userSettings?.person_2_name || "Douglas";
        const accountId = profile?.account_id;

        async function sendMessage(text: string, replyMarkup?: any) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", reply_markup: replyMarkup })
            });
        }

        async function answerCallback(text?: string) {
            if (!callbackQuery) return;
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQuery.id, text })
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

            // PERGUNTA SOBRE SALVAR NOTA FISCAL (Se houver imagem)
            if (sessionData.base64Image && sessionData.save_receipt === undefined) {
                await sendMessage("📸 Identifiquei uma nota fiscal. Deseja salvar a foto no site?", {
                    inline_keyboard: [[
                        { text: "Sim, Salvar ✅", callback_data: "set_save_receipt:true" },
                        { text: "Não, apenas o dado ❌", callback_data: "set_save_receipt:false" }
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
                user_id: userId,
                account_id: accountId,
                date: data.date || new Date().toISOString().split("T")[0],
                description: data.description || "Transação via Tlg",
                observacao: data.observacao || null,
                type: "expense",
                total_value: total,
                value_per_person: valuePerPerson,
                category: data.category || "Outros",
                is_couple: data.for_who === "Casal",
                paid_by: data.paid_by || (data.for_who !== "Casal" ? data.for_who : null),
                for_who: data.for_who,
                bank_id: data.bank_id,
                payment_method_id: data.payment_method_id,
                is_installment: !!data.is_installment,
                total_installments: Number(data.total_installments) || 1,
                installment_number: 1,
                installment_value: !!data.is_installment ? (total / Math.max(1, Number(data.total_installments))) : total,
            };

            const { data: tx, error } = await supabase.from("transactions").insert(transactionObj).select().single();
            
            if (error) {
                await sendMessage(`❌ Erro ao salvar: ${error.message}`);
                return;
            }

            // SALVAR IMAGEM SE SOLICITADO
            if (data.save_receipt && data.base64Image && tx) {
                const fileName = `${userId}/${Date.now()}.jpg`;
                const fileBody = base64ToUint8(data.base64Image);
                
                const { error: uploadError } = await supabase.storage
                    .from('comprovantes')
                    .upload(fileName, fileBody, { contentType: 'image/jpeg', upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('comprovantes').getPublicUrl(fileName);
                    await supabase.from("comprovantes_lancamento").insert({
                        lancamento_id: tx.id,
                        user_id: userId,
                        file_url: publicUrl,
                        file_name: fileName,
                        file_type: 'image/jpeg'
                    });
                }
            }

            await sendMessage(`✅ *Lançamento Realizado!* 100% Completo!\n\n🛒 *Local:* ${transactionObj.description}\n💰 *Valor:* R$ ${transactionObj.total_value.toFixed(2).replace('.', ',')}\n👤 *Para:* ${transactionObj.for_who}`);
            await supabase.from("telegram_sessions").delete().eq("chat_id", chat_id.toString());
        }

        if (callbackQuery) {
            const [action, value] = callbackQuery.data.split(":");
            const { data: session } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chat_id.toString()).single();
            if (!session) return new Response("OK", { status: 200 });

            const updatedData = { ...session.data };
            if (action === "set_for_who") { updatedData.for_who = value; if (value !== "Casal") updatedData.paid_by = value; }
            else if (action === "set_bank") updatedData.bank_id = value;
            else if (action === "set_method") updatedData.payment_method_id = value;
            else if (action === "set_installment") updatedData.is_installment = value === "true";
            else if (action === "set_save_receipt") updatedData.save_receipt = value === "true";

            await supabase.from("telegram_sessions").update({ data: updatedData }).eq("chat_id", chat_id.toString());
            await answerCallback();
            await askNextQuestion(updatedData);
            return new Response("OK", { status: 200 });
        }

        const { data: activeSession } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chat_id.toString()).single();
        if (activeSession) {
            const text = message.text || "";
            const num = parseFloat(text.replace(',', '.'));
            if (!isNaN(num)) {
                const updatedData = { ...activeSession.data };
                if (!updatedData.total_value) updatedData.total_value = num;
                else if (updatedData.is_installment && (!updatedData.total_installments || updatedData.total_installments <= 1)) updatedData.total_installments = Math.round(num);
                await supabase.from("telegram_sessions").update({ data: updatedData }).eq("chat_id", chat_id.toString());
                await askNextQuestion(updatedData);
                return new Response("OK", { status: 200 });
            }
        }

        let messageText = message.text || message.caption || "";
        let base64Image = null;
        if (message.photo && message.photo.length > 0) {
            const fileId = message.photo[message.photo.length - 1].file_id;
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            const fileInfo = await fileRes.json();
            if (fileInfo.ok) {
                const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`);
                base64Image = uint8ToBase64(new Uint8Array(await imgRes.arrayBuffer()));
            }
        }

        if (!messageText && !base64Image) return new Response("OK", { status: 200 });
        await sendMessage("🤖 Processando com IA...");

        const categoriesData = await supabase.from("categories").select("name");
        const banksData = await supabase.from("banks").select("name");
        const methodsData = await supabase.from("payment_methods").select("name");

        const prompt = `Extraia dados desta mensagem/imagem. REGRAS OBSERVAÇÃO: Se nota fiscal, liste TODOS os itens. JSON: {
            "date": "YYYY-MM-DD", "description": "local", "total_value": 0.00, "category": "uma de: [${categoriesData.data?.map(c=>c.name).join(", ")}]",
            "observacao": "itens...", "for_who": "null ou nome", "bank_name": "null ou nome", "payment_method_name": "null ou nome", "is_installment": bool
        }`;

        const parts = [{ text: prompt }];
        if (base64Image) parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } });
        if (messageText) parts[0].text += `\nTexto: ${messageText}`;

        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"];
        let aiText = "";
        let geminiSuccess = false;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Tentando modelo: ${modelName}...`);
                const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts }] })
                });

                if (gRes.ok) {
                    const gData = await gRes.json();
                    aiText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (aiText) {
                        geminiSuccess = true;
                        break;
                    }
                }
            } catch (err) {
                console.error(`Erro no modelo ${modelName}:`, err);
            }
        }

        if (!geminiSuccess) {
            await sendMessage("⚠️ O servidor da IA está sobrecarregado agora. Por favor, tente reenviar em instantes.");
            return new Response("OK", { status: 200 });
        }
        
        // Captura o JSON de forma mais robusta
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI returned no JSON:", aiText);
            await sendMessage("⚠️ Não consegui extrair os dados da nota automaticamente. Pode tentar tirar outra foto?");
            return new Response("OK", { status: 200 });
        }

        let parsed = {};
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("JSON Parse Fail:", e, aiText);
            await sendMessage("⚠️ Houve um erro ao processar os itens da nota. Tente novamente.");
            return new Response("OK", { status: 200 });
        }

        const fBank = banks?.find(b => b.name.toLowerCase().includes(parsed.bank_name?.toLowerCase()));
        const fMethod = paymentMethods?.find(pm => pm.name.toLowerCase().includes(parsed.payment_method_name?.toLowerCase()));

        const sessionData = { ...parsed, bank_id: fBank?.id, payment_method_id: fMethod?.id, base64Image };
        await supabase.from("telegram_sessions").upsert({ chat_id: chat_id.toString(), user_id: userId, data: sessionData });
        await askNextQuestion(sessionData);
        return new Response("OK", { status: 200 });

    } catch (e) { console.error(e); return new Response("OK", { status: 200 }); }
});
