import { getDb, type CustomContext } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { NotFoundError } from "../errors/NotFoundError";

type Params = {
  context: CustomContext;
  eventId: string;
};

export const deleteEvent = async ({ context, eventId }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const existing = await db
    .selectFrom("event")
    .select(["event_id"]) as any;

  const row = await (existing as any)
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!row) {
    throw new NotFoundError("Event not found")
  }

  await db
    .updateTable("event")
    .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .where("event_id", "=", eventId)
    .where("user_id", "=", userId)
    .execute();
};

