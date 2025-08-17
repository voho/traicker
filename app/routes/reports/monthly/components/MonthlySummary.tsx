import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/globals';
import { PriceDisplay } from '~/routes/reports/components/PriceDisplay';

interface MonthlySummaryProps {
  month: number;
  year: number;
}

export function MonthlySummary({ month, year }: MonthlySummaryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['monthlySummary', year, month],
    queryFn: () =>
      apiClient.api.report.summary[':year'][':month']
        .$get({
          param: { year: String(year), month: String(month) },
        })
        .then((res) => res.json()),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl mb-4">Finanční přehled</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Celkové příjmy</h4>
          <p className="text-2xl font-bold">
            <PriceDisplay amount={data?.totalIncome ?? 0} />
          </p>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Celkové výdaje</h4>
          <p className="text-2xl font-bold">
            <PriceDisplay amount={-(data?.totalExpense ?? 0)} />
          </p>
        </div>
      </div>
    </div>
  );
}
