import {getDb, type CustomContext} from "~/globals";
import type {PagingRequest, PagedResult} from "~/backend/types";
import {getLoggedUserOrFail} from "~/backend/assert/getLoggedUserOrFail";
import {getPagedResult} from "~/backend/utils/getPagedResult";

type Params = {
    context: CustomContext
    paging: PagingRequest
}

type Item = {
    dateIso?: string
    type?: string
    item?: string
    amount?: number
    currency?: string
    explanationText?: string
    explanationConfidence?: number
}

export const getEvents = async ({context, paging}: Params): Promise<PagedResult<Item>> => {
    const db = getDb(context)
    const userId = getLoggedUserOrFail(context)

    const query = db.selectFrom("events")
        .where("user_id", "=", userId)
        .where("status", "=", "done")

    const count = await query
        .select(eb => eb.fn.countAll().as("count"))
        .executeTakeFirstOrThrow()

    const payload = await query
        .select(["ai_date", "ai_type", "ai_amount", "ai_currency", "ai_desc", "ai_explain", "ai_confidence"])
        .orderBy("ai_date desc")
        .offset(paging.page * paging.pageSize)
        .limit(paging.pageSize)
        .execute()

    return getPagedResult(paging, Number(count.count), payload.map(it => {
        let amount: number | undefined = undefined

        if (it.ai_type === 'expense' && it.ai_amount) {
            amount = -it.ai_amount
        } else if (it.ai_type === 'income' && it.ai_amount) {
            amount = it.ai_amount
        }

        return ({
            dateIso: it.ai_date ?? undefined,
            type: it.ai_type ?? undefined,
            item: it.ai_desc ?? undefined,
            explanationText: it.ai_explain ?? undefined,
            explanationConfidence: it.ai_confidence ?? undefined,
            amount,
            currency: it.ai_currency ?? undefined
        });
    }))
}
