import type {InferResponseType} from "hono";
import {apiClient} from "~/globals";
import { PiMagicWand } from "react-icons/pi";
import { FiUser, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { EditEventModal } from "~/routes/reports/components/modals/EditEventModal";

type Transaction = NonNullable<InferResponseType<typeof apiClient.api.events.$get>>["payload"][number];
type Category = NonNullable<InferResponseType<typeof apiClient.api.categories.$get>>["categories"][number];

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  const queryClient = useQueryClient();
  const [editState, setEditState] = useState<{open: boolean, tx?: Transaction}>({open: false});

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => apiClient.api.event[":eventId"].$delete({ param: { eventId } }),
    onSuccess: () => {      queryClient.invalidateQueries()    }
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => apiClient.api.categories.$get().then((r) => r.json()),
  });

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    (categoriesData?.categories ?? []).forEach((c: Category) => map.set(c.categoryId, c));
    return map;
  }, [categoriesData]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-3 px-4 text-right">Datum</th>
            <th className="py-3 px-4 text-left">Popis</th>
            <th className="py-3 px-4 text-right">Částka</th>
            <th className="py-3 px-4 text-left">Měna</th>
            <th className="py-3 px-4 text-left">Kategorie</th>
            <th className="py-3 px-4 text-right">Akce</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
              <td className="py-3 px-4 text-right whitespace-nowrap">{transaction.dateIso ? new Date(transaction.dateIso).toLocaleDateString('cs-CZ') : '-'}</td>
              <td className="py-3 px-4">
                <div>{transaction.item ?? '-'}</div>
                {transaction.explanationText ? (
                  <div className="text-xs text-gray-500 inline-flex items-center gap-2 mt-1">
                    {transaction.aiModel === 'manual' ? (
                      <FiUser
                        className="w-4 h-4 text-gray-400"
                        aria-label="Manuální záznam"
                        title="Manuální záznam"
                      />
                    ) : (
                      <PiMagicWand
                        className="w-4 h-4 text-gray-400"
                        aria-label="AI záznam"
                        title="AI záznam"
                      />
                    )}
                    <span>{transaction.explanationText}</span>
                  </div>
                ) : null}
                {transaction.explanationConfidence !== undefined && transaction.explanationConfidence !== 1 ? (
                  <div className="text-xs text-gray-600 mt-1">(jistota: {transaction.explanationConfidence})</div>
                ) : null}
              </td>
              <td className="py-3 px-4 text-right whitespace-nowrap">
                {(() => {
                  const amount = transaction.amount ?? 0;
                  const formatted = new Intl.NumberFormat('cs-CZ').format(Math.abs(amount));
                  const negative = amount < 0;
                  const color = negative ? 'text-red-400' : 'text-green-400';
                  const prefix = negative ? '-' : '+';
                  return (
                    <span className={`font-bold ${color}`}>{prefix}{formatted}</span>
                  );
                })()}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">{transaction.currency ?? '-'}</td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const cid = transaction.categoryId as string | undefined;
                    if (!cid) return <span className="text-xs text-gray-500">-</span>;
                    const cat = categoriesById.get(cid);
                    if (!cat) return <span className="text-xs text-gray-500">-</span>;
                    return (
                      <span className="inline-flex items-center gap-2 text-xs" title={cat.description ?? undefined}>
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-white/10"
                          style={cat.color ? { background: cat.color } : undefined}
                          aria-hidden
                        >
                          {cat.emoji ? <span className="text-base leading-none">{cat.emoji}</span> : null}
                        </span>
                        <span className="font-medium">{cat.title}</span>
                      </span>
                    );
                  })()}
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 rounded-md border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white bg-transparent transition-colors"
                    aria-label="Upravit"
                    onClick={() => setEditState({ open: true, tx: transaction })}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded-md border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white bg-transparent transition-colors"
                    aria-label="Smazat"
                    onClick={() => {
                      if (!transaction.eventId) return;
                      if (confirm("Opravdu smazat tento záznam?")) {
                        deleteMutation.mutate(transaction.eventId);
                      }
                    }}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <EditEventModal
        isOpen={editState.open}
        onClose={() => setEditState({open: false})}
        eventId={editState.tx?.eventId ?? ""}
        initial={{
          dateIso: editState.tx?.dateIso,
          description: editState.tx?.item,
          type: editState.tx?.type as any,
          amount: editState.tx?.amount,
          currency: editState.tx?.currency,
          // @ts-ignore - modal accepts categoryId via any in initial
          categoryId: editState.tx?.categoryId,
        }}
      />
    </div>
  );
}
