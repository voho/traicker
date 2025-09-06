import {v4 as uuidv4} from 'uuid';
import {type CustomContext, getDb} from "~/globals";
import {getLoggedUserOrFail} from "~/backend/assert/getLoggedUserOrFail";
import {processEvent} from "~/backend/processEvent";
import { ensureUser } from './ensureUser';

type Params = {
    context: CustomContext
    prompt: string
}

export const storeEvent = async ({context, prompt}: Params) => {
    const db = getDb(context)
    const loggedUserId = getLoggedUserOrFail(context)
    const randomId = uuidv4()

    await ensureUser({context})

    await db.insertInto("event_raw")
        .values({
            created_at: new Date().toUTCString(),
            raw_event_id: randomId,
            user_id: loggedUserId,
            status: 'new',
            prompt
        })
        .execute()

    // keep execute in background
    context.executionCtx.waitUntil(processEvent({context, rawEventId: randomId, prompt}))
}