import type { CustomContext } from "~/globals";
import { getDb } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { getEventsContextBlock, type EventContextInput } from "~/backend/utils/context";

type Params = {
  context: CustomContext;
  range: {
    fromIso: string; // inclusive, ISO 8601 string
    toIso: string;   // exclusive, ISO 8601 string
  };
  title?: string; // optional markdown title
};

// Fetches user's events within a time range and returns a markdown summary.
export const getEventsForAi = async ({ context, range, title }: Params): Promise<string> => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const rows = await db
    .selectFrom("event")
    .select([
      "effective_at",
      "description",
      "amount",
      "currency",
      "type",
    ])
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .where("effective_at", ">=", range.fromIso)
    .where("effective_at", "<", range.toIso)
    .orderBy("effective_at", "asc")
    .execute();

  const events: EventContextInput[] = rows.map((r) => ({
    dateIso: r.effective_at,
    description: r.description,
    amount: Number(r.amount),
    currency: r.currency,
    type: r.type,
  }));

  const headerTitle = title ?? `Events ${range.fromIso.slice(0, 10)} → ${range.toIso.slice(0, 10)}`;
  return getEventsContextBlock(events, headerTitle);
};
