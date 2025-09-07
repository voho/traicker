import { v4 as uuidv4 } from "uuid";
import { getDb, type CustomContext, getAiClient } from "~/globals";
import { getLoggedUserOrFail } from "../assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
  rawEventId: string;
  prompt: string;
};

export const processEvent = async ({ context, rawEventId, prompt }: Params) => {
  const db = getDb(context)
  const ai = await getAiClient(context)
  const loggedUserId = getLoggedUserOrFail(context)
  const eventId = uuidv4()

  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Jsi API, které zpracovává text a extrahuje z něj informace o výdajích nebo příjmech. " +
            "Jedem dotaz vyjadřuje právě jeden příjem nebo výdej." +
            "Uživatel zadá krátký text nebo zkratku. Tvým úkolem je extrahovat typ, datum, popis, částku a měnu. " +
            "Pokud není jasné, zda se jedná o výdaj nebo příjem, předpokládej, že jde o výdaj. " +
            "Pokud není uvedena měna, předpokládej CZK. " +
            "Teď je " + new Date().toUTCString() + " UTC. " +
            "Výstup musí být JSON objekt vždy se všemi těmito klíči: " +
            "Typ ('type') musí být 'income' (příjem) nebo 'expense' (výdaj). " +
            "Datum ('date') musí být datum, kdy k události došlo. Pokud to není jasné, vrať null. Teď je " + new Date().toUTCString() + " UTC. " +
            "Popis ('description') musí být v češtině a stručně popisuje, za co je výdaj nebo z čeho je to příjem. " +
            "Částka ('amount') musí být vždy kladná, nenulová, číselná hodnota. " +
            "Currency je měna ISO 4217 kód (např. CZK). " +
            "Vysvětlení (explain) je velmi stručné vysvětlení, jak jsi to vše odvodil. " +
            "Confidence je hodnota 0-1, která vyjadřuje tvou jistotu (0 = zcela hádám, 1 = jsem si zcela jistý).",
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices?.[0]?.message?.content ?? "{}"
    let aiResponse: any
    try { aiResponse = JSON.parse(content) } catch { aiResponse = {} }

    const type = aiResponse?.type === 'income' ? 'income' : 'expense'
    const amountNum = Number(aiResponse?.amount)
    const amount = Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0
    const currencyRaw = String(aiResponse?.currency ?? 'CZK')
    const currency = (currencyRaw || 'CZK').toUpperCase()
    const dateStr = String(aiResponse?.date ?? '')
    const parsedDate = !Number.isNaN(Date.parse(dateStr)) ? new Date(dateStr) : new Date()
    const effectiveAt = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate())).toISOString()
    const explain = String(aiResponse?.explain ?? '').slice(0, 500)
    const confNum = Number(aiResponse?.confidence)
    const aiConfidence = Number.isFinite(confNum) ? Math.min(1, Math.max(0, confNum)) : 0

    // Only insert if we have a positive amount
    if (amount <= 0) {
      throw new Error('AI nevrátilo platnou částku')
    }

    await db.insertInto('event').values({
      event_id: eventId,
      raw_event_id: rawEventId,
      user_id: loggedUserId,
      ai_model: 'gpt-4o@v1',
      ai_confidence: aiConfidence,
      ai_explain: explain || 'AI extrakce',
      type,
      description: String(aiResponse?.description ?? '').slice(0, 500) || 'Bez popisu',
      amount,
      currency,
      effective_at: effectiveAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }).execute()

    await db.updateTable('event_raw').set({ status: 'done', error: null }).where('raw_event_id', '=', rawEventId).execute()
  } catch (e) {
    // Persist failure against the raw record (status must match CHECK)
    await db.updateTable('event_raw')
      .set({ status: 'failed', error: (e as Error)?.message?.slice(0, 500) ?? 'unknown error' })
      .where('raw_event_id', '=', rawEventId)
      .execute()
  }
}
