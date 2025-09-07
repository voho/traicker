import { sql } from "kysely";
import type { CustomContext } from "~/globals";
import { getDb } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
  month: number;
  year: number;
};

export const getMonthlySummaryPerCategory = async ({ context, month, year }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  // Sum income and expense separately, grouped by category and currency
  const rows = await db
    .selectFrom("event as e")
    .leftJoin("category as c", "c.category_id", "e.category_id")
    .select([
      "e.category_id as category_id",
      "e.currency as currency",
      // include some category details for display (no description)
      "c.title as category_title",
      "c.emoji as emoji",
      "c.color as color",
      sql`SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END)`.as("income"),
      sql`SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END)`.as("expense"),
    ])
    .where("e.user_id", "=", userId)
    .where("e.deleted_at", "is", null)
    .where("e.effective_at", ">=", startDate.toISOString())
    .where("e.effective_at", "<", endDate.toISOString())
    .groupBy(["e.category_id", "e.currency", "c.title", "c.emoji", "c.color"])
    .orderBy("expense", "desc")
    .execute();

  return {
    items: rows.map((r) => ({
      categoryId: r.category_id ?? undefined,
      categoryTitle: r.category_title ?? undefined,
      emoji: r.emoji ?? undefined,
      color: r.color ?? undefined,
      currency: r.currency,
      income: Number(r.income) || 0,
      expense: Number(r.expense) || 0,
    })),
    period: { year, month, fromIso: startDate.toISOString(), toIso: endDate.toISOString() },
  };
}
