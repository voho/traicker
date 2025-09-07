import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/globals";

type Props = { month: number; year: number };

export function CategoryTotalsTable({ month, year }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["monthly-per-category-table", year, month],
    queryFn: async () =>
      apiClient.api.report["summary-per-category"][":year"][":month"].$get({ param: { year: String(year), month: String(month) } }).then((r) => r.json()),
  });

  if (isLoading) return <div className="text-sm text-gray-400">Načítání souhrnu…</div>;
  if (isError) return <div className="text-sm text-red-400">Chyba při načítání souhrnu</div>;

  // Aggregate across currencies by category
  const byCat = new Map<string, { key: string; name: string; emoji?: string; color?: string; income: number; expense: number }>();
  for (const it of data?.items ?? []) {
    const key = it.categoryId ?? "__uncat__";
    const name = it.categoryTitle ?? "(bez kategorie)";
    const acc = byCat.get(key) ?? { key, name, emoji: it.emoji, color: it.color, income: 0, expense: 0 };
    acc.income += Number(it.income || 0);
    acc.expense += Number(it.expense || 0);
    if (!acc.emoji && it.emoji) acc.emoji = it.emoji;
    if (!acc.color && it.color) acc.color = it.color;
    byCat.set(key, acc);
  }

  const rows = Array.from(byCat.values()).map((r) => ({ ...r, net: r.income - r.expense }));

  // Sort by highest expense desc
  rows.sort((a, b) => b.expense - a.expense);

  const fmt = (n: number) => new Intl.NumberFormat("cs-CZ").format(Math.round(n));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="py-2 px-3">Kategorie</th>
            <th className="py-2 px-3 text-right">Příjmy</th>
            <th className="py-2 px-3 text-right">Výdaje</th>
            <th className="py-2 px-3 text-right">Čisté</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-white/5">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-white/10"
                    style={r.color ? { background: r.color } : undefined}
                    aria-hidden
                  >
                    {r.emoji ? <span className="text-xs leading-none">{r.emoji}</span> : null}
                  </span>
                  <span className="truncate">{r.name}</span>
                </div>
              </td>
              <td className="py-2 px-3 text-right text-green-400 font-medium">{fmt(r.income)}</td>
              <td className="py-2 px-3 text-right text-red-400 font-medium">{fmt(r.expense)}</td>
              <td className="py-2 px-3 text-right font-semibold">{fmt(r.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
