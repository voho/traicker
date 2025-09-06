import { v4 as uuidv4 } from 'uuid';
import { type CustomContext, getDb } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { processEvent } from "~/backend/processEvent";
import { ensureUser } from './ensureUser';
import { storeEventSchema } from "~/schemas/event";

type Params = {
  context: CustomContext
  prompt: unknown
}

export const storeEvent = async ({ context, prompt }: Params) => {
  const db = getDb(context)
  const loggedUserId = getLoggedUserOrFail(context)
  const randomId = uuidv4()

  const parsed = storeEventSchema.parse({ prompt })

  await ensureUser({ context })

  await db.insertInto("event_raw")
    .values({
      created_at: new Date().toISOString(),
      raw_event_id: randomId,
      user_id: loggedUserId,
      status: 'new',
      prompt: parsed.prompt,
    })
    .execute()

  // keep execute in background
  context.executionCtx.waitUntil(processEvent({ context, rawEventId: randomId, prompt: parsed.prompt }))
}
