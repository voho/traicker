import { v4 as uuidv4 } from 'uuid'
import { getDb, type CustomContext } from '~/globals'
import { getLoggedUserOrFail } from '~/backend/assert/getLoggedUserOrFail'
import { ensureUser } from '../user/ensureUser'
import { manualEventSchema } from "~/schemas/event"

type Params = {
  context: CustomContext
  input: unknown
}

export const storeManualEvent = async ({ context, input }: Params) => {
  const db = getDb(context)
  const userId = getLoggedUserOrFail(context)
  const eventId = uuidv4()

  await ensureUser({ context })

  // Validate and normalize input
  const parsed = manualEventSchema.parse(input)
  const src = parsed.effective_at ? new Date(parsed.effective_at) : new Date()
  const effectiveAt = new Date(Date.UTC(src.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate())).toISOString()

  await db
    .insertInto('event')
    .values({
      event_id: eventId,
      raw_event_id: null,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      effective_at: effectiveAt,
      description: parsed.description,
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      ai_explain: 'vloženo ručně',
      ai_confidence: 1,
      ai_model: 'manual',
      category_id: parsed.categoryId ?? null,
    })
    .execute()
}
