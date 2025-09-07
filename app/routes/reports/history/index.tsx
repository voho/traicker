import { TransactionList } from "./components/TransactionList";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {apiClient} from "~/globals";
import { PiMagicWand } from "react-icons/pi";

export default function HistoryReport() {
  const {data, isFetching} = useQuery({
    queryKey: ["event-history"],
    queryFn: () => apiClient.api.events.$get().then(res => res.json())
  })
  const queryClient = useQueryClient();

  const categorize = useMutation({
    mutationFn: async () => {
      const res = await apiClient.api["categorize-events"].$post({ json: { force: false } });
      if (!res.ok) throw new Error('Nepodařilo se spustit kategorizaci');
      return res.json().catch(() => ({}));
    },
    onSuccess: () => { queryClient.invalidateQueries(); }
  });

  const categorizeForce = useMutation({
    mutationFn: async () => {
      const res = await apiClient.api["categorize-events"].$post({ json: { force: true } });
      if (!res.ok) throw new Error('Nepodařilo se spustit kategorizaci');
      return res.json().catch(() => ({}));
    },
    onSuccess: () => { queryClient.invalidateQueries(); }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historie</h1>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => categorize.mutate()}
            disabled={categorize.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
          >
            <PiMagicWand className="w-4 h-4" />
            <span>Doplnit kategorie</span>
          </button>
          <button
            type="button"
            onClick={() => categorizeForce.mutate()}
            disabled={categorizeForce.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
            title="Znovu zkusí kategorizovat všechny záznamy"
          >
            <PiMagicWand className="w-4 h-4" />
            <span>Znovu kategorizovat vše</span>
          </button>
        </div>
      </div>

      <TransactionList transactions={data?.payload ?? []} />
    </div>
  );
}
