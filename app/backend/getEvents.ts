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

    const query = (db as unknown as any).selectFrom("event")
        .where("user_id", "=", userId)
        .where("deleted_at", "is", null)

    const count = await query
        .select((eb: any) => eb.fn.countAll().as("count"))
        .executeTakeFirstOrThrow()

    const payload = await query
        .select([
            "effective_at",
            "type",
            "amount",
            "currency",
            "description",
            "ai_explain",
            "ai_confidence"
        ])
        .orderBy("effective_at", "desc")
        .offset(paging.page * paging.pageSize)
        .limit(paging.pageSize)
        .execute()

    return getPagedResult(paging, Number((count as any).count), payload.map((it: any) => {
        let amount: number | undefined = undefined
        const val = Number(it.amount)

        if (it.type === 'expense' && !Number.isNaN(val)) {
            amount = -val
        } else if (it.type === 'income' && !Number.isNaN(val)) {
            amount = val
        }

        return ({
            dateIso: it.effective_at ?? undefined,
            type: it.type ?? undefined,
            item: it.description ?? undefined,
            explanationText: it.ai_explain ?? undefined,
            explanationConfidence: it.ai_confidence ?? undefined,
            amount,
            currency: it.currency ?? undefined
        });
    }))
}
