import { sql } from "kysely";
import type { CustomContext } from "~/globals";
import { getDb } from "~/globals";
import { getLoggedUserOrFail } from "./assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
  month: number;
  year: number;
};

export const getMonthlySummary = async ({ context, month, year }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const daily = await db
    .selectFrom("event")
    .select([
      sql`strftime('%d', effective_at)`.as("day"),
      sql`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)`.as("income"),
      sql`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)`.as("expense"),
    ])
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .where("effective_at", ">=", startDate.toISOString())
    .where("effective_at", "<", endDate.toISOString())
    .groupBy("day")
    .execute();

  const totals = await db
    .selectFrom("event")
    .select([
      sql`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)`.as("totalIncome"),
      sql`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)`.as("totalExpense"),
    ])
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .where("effective_at", ">=", startDate.toISOString())
    .where("effective_at", "<", endDate.toISOString())
    .executeTakeFirst();

  const dailySummary = daily.reduce((acc, row) => {
    const day = Number(row.day);
    if (day) {
        acc[day] = {
            income: Number(row.income) || 0,
            expense: Number(row.expense) || 0,
        };
    }
    return acc;
  }, {} as Record<number, { income: number; expense: number }>);


  return {
    totalIncome: Number(totals?.totalIncome) || 0,
    totalExpense: Number(totals?.totalExpense) || 0,
    dailySummary,
  };
};
