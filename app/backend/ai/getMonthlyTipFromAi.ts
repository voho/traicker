import type { CustomContext } from "~/globals";
import { getAiClient } from "~/globals";
import { getEventsForAi } from "~/backend/ai/context/getEventsForAi";
import { getAiResult, type AiStringResult } from "../category/utils/getAiResult";

type Params = {
  context: CustomContext;
  year: number;
  month: number; // 1-12
};

export const getMonthlyTipFromAi = async ({ context, year, month }: Params): Promise<AiStringResult> => {
  const ai = await getAiClient(context);

  // Compute month range in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  // Human-readable transactions summary to feed to the model
  const transactionsMarkdown = await getEventsForAi({
    context,
    range: { fromIso: startDate.toISOString(), toIso: endDate.toISOString() },
    title: `Transakce ${year}-${String(month).padStart(2, '0')}`,
  });

  const promptCz = [
    "Dej mi měsíční finanční radu a tip na základě následujících transakcí za tento měsíc.",
    "Buď konkrétní, ale stručný (maximálně 3 odstavce).",
    "Nepřepisuj transakce, jen z nich vycházej.",
    "Odpověz česky.",
    "",
    transactionsMarkdown,
  ].join("\n");

  const response = await ai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Jsi užitečný finanční poradce, který dává praktické a srozumitelné rady." },
      { role: "user", content: promptCz },
    ],
    temperature: 0.7,
  });

  const responseText = response.choices?.[0]?.message?.content?.trim() || "";

  return getAiResult({
    payload: responseText,
    prompt: promptCz,
    generatedAt: new Date(),
  })
};
