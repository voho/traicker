import { PriceDisplay } from '~/routes/reports/components/PriceDisplay';

export function MonthlySummary() {
  // In a real app, this would come from a loader or API call
  const monthlyData = {
    income: 22500,
    expenses: -17830
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl mb-4">Finanční přehled</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Celkové příjmy</h4>
          <p className="text-2xl font-bold">
            <PriceDisplay amount={monthlyData.income} />
          </p>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Celkové výdaje</h4>
          <p className="text-2xl font-bold">
            <PriceDisplay amount={monthlyData.expenses} />
          </p>
        </div>
      </div>
    </div>
  );
}
