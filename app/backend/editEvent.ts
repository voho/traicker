import { getDb, type CustomContext } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { manualEventSchema } from "~/schemas/event";
import { NotFoundError } from "./errors/NotFoundError";

type Params = {
  context: CustomContext;
  eventId: string;
  input: unknown;
};

export const editEvent = async ({ context, eventId, input }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const parsed = manualEventSchema.parse(input);

  // Normalize to UTC midnight (day resolution)
  const src = parsed.effective_at ? new Date(parsed.effective_at) : new Date();
  const effectiveAt = new Date(
    Date.UTC(src.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate())
  ).toISOString();

  const existing = await (db as any)
    .selectFrom("event")
    .select(["event_id"]) // minimal
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!existing) {
    throw new NotFoundError("Event not found")
  }

  await db
    .updateTable("event")
    .set({
      effective_at: effectiveAt,
      description: parsed.description,
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      ai_confidence: 1,
      ai_model: "manual",
      ai_explain: "ručně upraveno",
      updated_at: new Date().toISOString(),
    })
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .execute();

  return { success: true };
};
