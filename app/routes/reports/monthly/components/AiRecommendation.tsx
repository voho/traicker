import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/globals';

type Props = {
  month: number;
  year: number;
};

export function AiRecommendation({ month, year }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['aiTip', year, month],
    queryFn: async () => {
        const res = await apiClient.api.ai['monthly-tip'][':year'][':month'].$get({
          param: { year: String(year), month: String(month) },
        });
        if (res.ok) {
          return await res.json()
        }
        throw await res.json()
    }
  })

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl mb-4">AI doporučení</h3>
      <div className="bg-gray-700/20 p-5 rounded-lg whitespace-pre-wrap">
        {isLoading && <p className="text-gray-400">AI přemýšlí…</p>}
        {isError && <p className="text-red-400">Nepodařilo se získat AI tip.</p>}
        {!isLoading && !isError && (
          <p className="text-gray-300">{data?.payload || 'Žádný tip není k dispozici.'}</p>
        )}
      </div>
    </div>
  );
}
