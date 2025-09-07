import { CategoryTrendStackedBar } from './CategoryTrendStackedBar';

export function TrendSummary() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <h3 className="text-xl mb-4">Dlouhodobý trend (6 měsíců)</h3>

          <CategoryTrendStackedBar />
    </div>
  );
}
