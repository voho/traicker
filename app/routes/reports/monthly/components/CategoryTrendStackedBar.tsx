import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/globals";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function CategoryTrendStackedBar() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["monthly-trend-per-category"],
    queryFn: async () => apiClient.api.report["summary-trend-per-category"].$get().then((r) => r.json()),
  });

  if (isLoading) return <div className="text-sm text-gray-400">Načítání trendu…</div>;
  if (isError) return <div className="text-sm text-red-400">Chyba při načítání trendu</div>;

  const months: { label: string }[] = (data?.months ?? []).map((m: any) => ({ label: `${String(m.month).padStart(2, '0')}/${m.year}` }));

  // Choose top N categories by total expense across period for readability
  const N = 8;
  const categories = (data?.categories ?? [])
    .map((c: any) => ({
      key: c.categoryId ?? "__uncat__",
      name: c.categoryTitle ?? "(bez kategorie)",
      color: c.color,
      totalExpense: c.series.reduce((acc: number, s: any) => acc + Number(s.expense || 0), 0),
      series: c.series,
    }))
    .sort((a: any, b: any) => b.totalExpense - a.totalExpense);

  const top = categories.slice(0, N);
  const others = categories.slice(N);

  // Build chart data per month
  const chartData = months.map((m, idx) => {
    const row: any = { month: m.label };
    for (const c of top) {
      row[c.name] = Number(c.series[idx]?.expense || 0);
    }
    // Aggregate others into a single stack
    row["Ostatní"] = others.reduce((acc: number, c: any) => acc + Number(c.series[idx]?.expense || 0), 0);
    return row;
  });

  const bars = top.map((c: any, i: number) => (
    <Bar key={c.name} dataKey={c.name} stackId="a" fill={c.color || defaultColors[i % defaultColors.length]} />
  ));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(v: any) => new Intl.NumberFormat('cs-CZ').format(Number(v)) + ' Kč'} />
          <Legend />
          {bars}
          <Bar dataKey="Ostatní" stackId="a" fill="#64748b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const defaultColors = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#22c55e", "#f97316",
];

