import { v4 as uuidv4 } from "uuid";
import { getDb, type CustomContext, getAiClient } from "~/globals";
import { getLoggedUserOrFail } from "./assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
  rawEventId: string;
  prompt: string;
};

export const processEvent = async ({ context, rawEventId, prompt }: Params) => {
  const db = getDb(context);
  const ai = await getAiClient(context);
  const loggedUserId = getLoggedUserOrFail(context);
  const randomId = uuidv4();

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
          "Teď je " +
          new Date().toUTCString() +
          " UTC. " +
          "Výstup musí být JSON objekt vždy se všemi těmito klíči: " +
          "Typ ('type') musí být 'income' (příjem) nebo 'expense' (výdaj). " +
          "Datum ('date') musí být datum, kdy k události došlo. Pokud to není jasné, vrať null. Teď je " +
          new Date().toUTCString() +
          " UTC. " +
          "Popis ('description') musí být v češtině a stručně popisuje, za co je výdaj nebo z čeho je to příjem. " +
          "Částka ('amount') musí být vždy kladná, nenulová, číselná hodnota. " +
          "Currency je měna ISO 4217 kód (např. CZK). " +
          "Vysvětlení (explain) je velmi stručné vysvětlení, jak jsi to vše odvodil. " +
          "Confidence je hodnota 0-1, která vyjadřuje tvou jistotu (0 = zcela hádám, 1 = jsem si zcela jistý).",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const aiResponse = JSON.parse(response.choices[0].message.content || "{}");

  if (aiResponse) {
    await db
      .insertInto("event")
      .values({
        event_id: randomId,
        raw_event_id: rawEventId,
        user_id: loggedUserId,
        ai_model: "gpt-4o@v1",
        ai_confidence: aiResponse.confidence,
        ai_explain: aiResponse.explain,
        type: aiResponse.type,
        description: aiResponse.description,
        amount: aiResponse.amount,
        currency: aiResponse.currency,
        effective_at: aiResponse.date,
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
      })
      .execute();

    await db
      .updateTable("event_raw")
      .set({ status: "done", error: null })
      .where("raw_event_id", "=", rawEventId)
      .execute();
  } else {
    await db
      .updateTable("event_raw")
      .set({ status: "error", error: JSON.stringify(aiResponse) })
      .where("raw_event_id", "=", rawEventId)
      .execute();
  }
};
