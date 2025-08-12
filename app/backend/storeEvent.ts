import {v4 as uuidv4} from 'uuid';
import {type CustomContext, getDb} from "~/globals";
import {getLoggedUserOrFail} from "~/backend/assert/getLoggedUserOrFail";
import {processEvent} from "~/backend/processEvent";

type Params = {
    context: CustomContext
    prompt: string
}

export const storeEvent = async ({context, prompt}: Params) => {
    const db = getDb(context)
    const loggedUserId = getLoggedUserOrFail(context)
    const randomId = uuidv4()

    await db.insertInto("events")
        .values({
            created_at: new Date().toUTCString(),
            updated_at: new Date().toISOString(),
            effective_at: new Date().toUTCString(),
            event_id: randomId,
            user_id: loggedUserId,
            status: 'new',
            prompt
        })
        .execute()

    // keep execute in background
    context.executionCtx.waitUntil(processEvent({context, eventId: randomId, prompt}))
}