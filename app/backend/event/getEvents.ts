import { getDb, type CustomContext } from "~/globals";
import type { PagingRequest, PagedResult } from "~/backend/types";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { getPagedResult } from "~/backend/category/utils/getPagedResult";

type Params = {
    context: CustomContext
    paging: PagingRequest
}

type Item = {
    eventId?: string
    dateIso?: string
    type?: string
    item?: string
    amount?: number
    currency?: string
    explanationText?: string
    explanationConfidence?: number
    aiModel?: string
    categoryId?: string
}

export const getEvents = async ({ context, paging }: Params): Promise<PagedResult<Item>> => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const baseQuery = db
    .selectFrom("event")
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null);

  const countRow = await baseQuery
    .select((eb) => eb.fn.countAll().as("count"))
    .executeTakeFirstOrThrow();

  const rows = await baseQuery
    .select([
      "event_id",
      "effective_at",
      "type",
      "amount",
      "currency",
      "description",
      "ai_explain",
      "ai_confidence",
      "ai_model",
      // single-category column
      "category_id",
    ])
    .orderBy("effective_at", "desc")
    .offset(paging.page * paging.pageSize)
    .limit(paging.pageSize)
    .execute();

  const items: Item[] = rows.map((it) => {
    let amount: number | undefined = undefined;
    const val = Number(it.amount);

    if (it.type === "expense" && !Number.isNaN(val)) {
      amount = -val;
    } else if (it.type === "income" && !Number.isNaN(val)) {
      amount = val;
    }

    return {
      eventId: it.event_id ?? undefined,
      dateIso: it.effective_at ?? undefined,
      type: it.type ?? undefined,
      item: it.description ?? undefined,
      explanationText: it.ai_explain ?? undefined,
      explanationConfidence: it.ai_confidence ?? undefined,
      amount,
      currency: it.currency ?? undefined,
      aiModel: it.ai_model ?? undefined,
      categoryId: it.category_id ?? undefined,
    };
  });

  const total = Number(countRow.count as unknown as string);
  return getPagedResult(paging, total, items);
};
