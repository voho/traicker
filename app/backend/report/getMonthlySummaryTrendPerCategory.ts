import type { CustomContext } from "~/globals";
import { getMonthlySummaryPerCategory } from "~/backend/report/getMonthlySummaryPerCategory";

type MonthKey = { year: number; month: number };

type SeriesPoint = {
  income: number;
  expense: number;
  diffIncome: number; // vs previous month
  diffExpense: number; // vs previous month
};

type CategoryTrend = {
  categoryId?: string;
  categoryTitle?: string;
  emoji?: string;
  color?: string;
  series: SeriesPoint[]; // ordered by months[]
  min: { income: number; expense: number };
  max: { income: number; expense: number };
};

type Result = {
  months: MonthKey[]; // ordered oldest -> newest
  categories: CategoryTrend[];
};

export const getMonthlySummaryTrendPerCategory = async ({ context }: { context: CustomContext }): Promise<Result> => {
  const months = buildPastMonths(6); // oldest -> newest

  // fetch all months
  const monthResults = await Promise.all(
    months.map((m) => getMonthlySummaryPerCategory({ context, year: m.year, month: m.month }))
  );

  // collect category ids across months
  const catIds = collectCategoryIds(monthResults);

  // build trends per category id (including undefined = uncategorized)
  const categories: CategoryTrend[] = [];
  for (const catId of catIds) {
    const series: SeriesPoint[] = [];
    let meta: { title?: string; emoji?: string; color?: string } = {};

    for (let i = 0; i < months.length; i++) {
      const items = monthResults[i].items;
      const found = items.filter((it) => (it.categoryId ?? undefined) === (catId ?? undefined));
      // Sum across currencies for the month
      const income = sum(found.map((f) => f.income || 0));
      const expense = sum(found.map((f) => f.expense || 0));

      // capture some meta from the latest non-empty item (prefer newer as we iterate forward, so overwrite if present)
      const withMeta = found.find((f) => f.categoryTitle || f.emoji || f.color);
      if (withMeta) {
        meta = { title: withMeta.categoryTitle, emoji: withMeta.emoji, color: withMeta.color };
      }

      const prev = series[series.length - 1];
      const diffIncome = prev ? income - prev.income : 0;
      const diffExpense = prev ? expense - prev.expense : 0;
      series.push({ income, expense, diffIncome, diffExpense });
    }

    // compute min/max across the series
    const min = { income: Math.min(...series.map((s) => s.income)), expense: Math.min(...series.map((s) => s.expense)) };
    const max = { income: Math.max(...series.map((s) => s.income)), expense: Math.max(...series.map((s) => s.expense)) };

    categories.push({
      categoryId: catId ?? undefined,
      categoryTitle: meta.title,
      emoji: meta.emoji,
      color: meta.color,
      series,
      min,
      max,
    });
  }

  return { months, categories };
};

// Helpers
const buildPastMonths = (count: number): MonthKey[] => {
  const out: MonthKey[] = [];
  const now = new Date();
  // last whole months ending with current month
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 });
  }
  return out;
};

const collectCategoryIds = (monthResults: Array<{ items: Array<{ categoryId?: string }> }>): Array<string | undefined> => {
  const set = new Set<string | undefined>();
  for (const m of monthResults) {
    for (const it of m.items) set.add(it.categoryId ?? undefined);
  }
  return Array.from(set);
};

const sum = (vals: number[]) => vals.reduce((a, b) => a + b, 0);

