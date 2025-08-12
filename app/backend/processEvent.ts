import {getDb, type CustomContext, getAiClient} from "~/globals";

type Params = {
    context: CustomContext
    eventId: string
    prompt: string
}

export const processEvent = async ({context, eventId, prompt}: Params) => {
    const db = getDb(context)
    const ai = await getAiClient(context)

    const response = await ai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: "Jsi API, které zpracovává text a extrahuje z něj informace o výdajích nebo příjmech. " +
                    "Jedem dotaz vyjadřuje právě jeden příjem nebo výdej." +
                    "Uživatel zadá krátký text nebo zkratku. Tvým úkolem je extrahovat popis, částku a měnu. " +
                    "Pokud není jasné, zda se jedná o výdaj nebo příjem, předpokládej, že jde o výdaj. " +
                    "Pokud není uvedena měna, předpokládej CZK. " +
                    "Výstup musí být JSON objekt vždy se všemi těmito klíči: " +
                    "Typ ('type') musí být 'income' (příjem) nebo 'expense' (výdaj). " +
                    "Datum ('date') musí být datum, kdy k události došlo. Pokud to není jasné, vrať null. Teď je " + new Date().toUTCString() + " UTC. " +
                    "Popis ('description') musí být v češtině a stručně popisuje, za co je výdaj nebo z čeho je to příjem. " +
                    "Částka ('amount') musí být vždy kladná, nenulová, číselná hodnota. " +
                    "Currency je měna ISO 4217 kód (např. CZK). " +
                    "Vysvětlení (explain) je velmi stručné vysvětlení, jak jsi to vše odvodil. " +
                    "Confidence je hodnota 0-1, která vyjadřuje tvou jistotu (0 = zcela hádám, 1 = jsem si zcela jistý)."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');

    console.log("ai response:", aiResponse)

    await db.updateTable("events")
        .set({
            status: 'done',
            ai_type: aiResponse.type ?? 'expense',
            ai_date: aiResponse.date ?? new Date().toUTCString(),
            ai_desc: aiResponse.description,
            ai_amount: aiResponse.amount ?? 0,
            ai_currency: aiResponse.currency ?? 'CZK',
            ai_confidence: aiResponse.confidence,
            ai_explain: aiResponse.explain,
        })
        .where("event_id", "=", eventId)
        .execute()
}
