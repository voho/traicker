import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/globals";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  month: number;
  year: number;
};

export function MonthlyOverviewChart({ month, year }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["monthlySummaryChart", year, month],
    queryFn: () =>
      apiClient.api.report.summary[":year"][":month"]
        .$get({ param: { year: String(year), month: String(month) } })
        .then((res) => res.json()),
  });

  const daysInMonth = new Date(year, month, 0).getDate();

  const dailySummary: Record<number, { income: number; expense: number }> =
    data?.dailySummary ?? {};

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const entry = dailySummary[day] || { income: 0, expense: 0 };
    return {
      day: String(day),
      income: Number(entry.income) || 0,
      // Show expenses as negative to visualize outflow below axis
      expense: -Math.abs(Number(entry.expense) || 0),
    };
  });

  const formatCZK = (n: number) =>
    `${new Intl.NumberFormat("cs-CZ").format(Math.abs(n))} Kč`;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl mb-4">Přehled příjmů a výdajů</h3>
      <div className="h-80">
        {isLoading ? (
          <div className="h-full bg-gray-700/30 rounded-lg flex items-center justify-center text-gray-400">
            Načítám graf...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" tickLine={false} />
              <YAxis
                stroke="#9CA3AF"
                tickFormatter={(v) => new Intl.NumberFormat("cs-CZ").format(Number(v))}
              />
              <Tooltip
                contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
                formatter={(value: any, name) => [formatCZK(Number(value)), name === "income" ? "Příjmy" : "Výdaje"]}
                labelFormatter={(label) => `Den ${label}`}
              />
              <Legend formatter={(val) => (val === "income" ? "Příjmy" : "Výdaje")} />
              <Bar dataKey="income" fill="#10B981" name="Příjmy" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" name="Výdaje" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
