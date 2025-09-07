import { MonthlyOverviewChart } from "./components/MonthlyOverviewChart";
import { MonthlySummary } from "./components/MonthlySummary";
import {AiRecommendation} from "~/routes/reports/monthly/components/AiRecommendation";
import { MonthSelector } from "./components/MonthSelector";
import { useState } from "react";
import { TrendSummary } from "./components/TrendSummary";

export default function MonthlyReport() {
  const [date, setDate] = useState({
    month: new Date().getMonth() + 1, // getMonth() is 0-indexed
    year: new Date().getFullYear(),
  });

  const handleMonthChanged = (month: number, year: number) => {
    setDate({ month, year });
  };

  return (
    <div className="space-y-6">
      <MonthSelector
        month={date.month}
        year={date.year}
        onMonthChanged={handleMonthChanged}
      />
      <AiRecommendation month={date.month} year={date.year} />
      <MonthlySummary month={date.month} year={date.year} />
      <MonthlyOverviewChart month={date.month} year={date.year} />
      <TrendSummary />
    </div>
  );
}
