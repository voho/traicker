import type { CustomContext } from "~/globals";
import { getDb, getAiClient } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { getCategoriesForAi } from "~/backend/ai/context/getCategoriesForAi";
import type { Kysely } from "kysely";
import type { DB } from "~/backend/db";

type Params = {
  context: CustomContext;
  input: { force: boolean };
};

// Temporary implementation: just fetch categories and log them
export const categorizeEvents = async ({ context, input }: Params) => {
  // Kick off background processing and return immediately
  context.executionCtx.waitUntil(runCategorization({ context, input }));
  return { success: true as const };
};

// Actual categorization workflow executed in background
const runCategorization = async ({ context, input }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  // If force is true, clear all categories for user's events first
  if (input.force) {
    await db
      .updateTable('event')
      .set({
        category_id: null,
        ai_category_explain: null ,
        ai_category_confidence: null ,
        ai_category_model: null ,
        updated_at: new Date().toISOString(),
      })
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .execute();
  }

  const categoriesJson = await loadCategoriesJson(context);

  const pageSize = 10;
  let page = 0;
  for (;;) {
    const paged = await db.selectFrom("event")
    .select([
      "event_id as eventId",
      "effective_at as dateIso",
      "category_id as categoryId",
      "description",
      "type",
      "amount",
      "currency",
    ])
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .where("category_id", "is", null)
    .orderBy("effective_at", "desc")
    .offset(page * pageSize)
    .limit(pageSize)
    .execute()

    const eventsPage: EventRow[] = paged.map((it) => ({
      event_id: it.eventId ?? '',
      description: it.description ?? '',
      amount: Number(it.amount ?? 0),
      currency: it.currency ?? 'CZK',
      type: it.type ?? 'expense',
      effective_at: it.dateIso ?? new Date().toISOString(),
      category_id: it.categoryId ?? null,
    }));

    const targetEvents = input.force ? eventsPage : eventsPage.filter(e => e.category_id == null);

    if (targetEvents.length > 0) {
      const prompt = buildCategorizationPrompt(categoriesJson, targetEvents);
      const raw = await askAiForMapping(context, prompt);
      const mapping = parseAndValidateMapping(raw, categoriesJson, targetEvents);
      if (mapping) {
        await applyMappings(db, mapping, 'gpt-4o');
      }
    }

    if ((paged.length ?? 0) < pageSize) break;
    page += 1;
  }
};

// Helpers
type EventRow = {
  event_id: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  effective_at: string;
  category_id: string | null;
};

const loadCategoriesJson = async (context: CustomContext) => getCategoriesForAi({ context });

// (removed old pre-pagination helpers)

const buildCategorizationPrompt = (categoriesJson: string, events: EventRow[]) => {
  const eventsForAi = events.map((e) => ({
    id: e.event_id,
    dateIso: e.effective_at,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    type: e.type,
  }));

  const system = "Jsi užitečný asistent, který vrací pouze čisté JSON výstupy bez dalšího textu.";
  const userPrompt = [
    "Úkol: Přiřaď ke každé transakci nejvhodnější a co nejkonkrétnější kategorii.",
    "",
    "Vstupy:",
    "1) Seznam kategorií (JSON):",
    categoriesJson,
    "",
    "2) Seznam transakcí (JSON):",
    JSON.stringify(eventsForAi),
    "",
    "Instrukce:",
    "- U každé transakce vyber právě jednu kategorii, která se nejlépe hodí.",
    "- Vrať pouze čisté JSON pole objektů, bez komentářů.",
    "- Každý objekt musí mít klíče: eventId, categoryId, explain (krátké zdůvodnění), confidence (0..1).",
    "",
    "Příklad výstupu (pouze struktura):",
    '[{"eventId":"<event_id>","categoryId":"<category_id>","explain":"...","confidence":0.9}]',
  ].join("\n");

  return { system, user: userPrompt };
};

const askAiForMapping = async (context: CustomContext, prompt: { system: string; user: string }) => {
  const ai = await getAiClient(context);
  const response = await ai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: 0,
  });
  return response.choices?.[0]?.message?.content ?? "";
};

const parseAndValidateMapping = (
  raw: string,
  categoriesJson: string,
  targetEvents: EventRow[],
): Array<{ eventId: string; categoryId: string; explain?: string; confidence?: number }> | null => {
  let parsed: Array<{ eventId: string; categoryId: string; explain?: string; confidence?: number }> = [];
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start >= 0 && end >= start) {
      try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { return null }
    } else {
      return null;
    }
  }

  const validEventIds = new Set(targetEvents.map((e) => e.event_id));
  const availableCategories = JSON.parse(categoriesJson) as Array<{ id: string }>;
  const validCategoryIds = new Set(availableCategories.map((c) => c.id));

  return parsed.filter((m) => validEventIds.has(m.eventId) && validCategoryIds.has(m.categoryId));
};

const applyMappings = async (
  db: Kysely<DB>,
  mapping: Array<{ eventId: string; categoryId: string; explain?: string; confidence?: number }>,
  model: string,
) => {
  const nowIso = new Date().toISOString();
  for (const m of mapping) {
    const conf = Number(m.confidence);
    await db
      .updateTable('event')
      .set({
        category_id: m.categoryId,
        ai_category_explain: m.explain ?? null,
        ai_category_confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : null,
        ai_category_model: model,
        updated_at: nowIso,
      })
      .where('event_id', '=', m.eventId)
      .execute();
  }
};
