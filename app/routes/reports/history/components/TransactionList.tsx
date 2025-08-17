import { PriceDisplay } from '~/routes/reports/components/PriceDisplay';
import type {InferResponseType} from "hono";
import {apiClient} from "~/globals";

type Transaction = NonNullable<InferResponseType<typeof apiClient.api.events.$get>>["payload"][number];

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-3 px-4 text-left">Datum</th>
            <th className="py-3 px-4 text-left">Popis</th>
            <th className="py-3 px-4 text-right">Částka</th>
            <th className="py-3 px-4 text-left">Měna</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
              <td className="py-3 px-4">{transaction.dateIso ? new Date(transaction.dateIso).toLocaleDateString('cs-CZ') : '-'}</td>
              <td className="py-3 px-4">{transaction.item ?? '-'}{
                transaction.explanationText ? (
                    <p className={"text-xs text-gray-500"}>{transaction.explanationText} </p>
                ) : <></>
              }{
                transaction.explanationConfidence ? (
                    <p className={"text-xs text-gray-600"}>(jistota: {transaction.explanationConfidence})</p>
                ) : <></>
              }
              </td>
              <td className="py-3 px-4 text-right">
                <PriceDisplay amount={transaction.amount ?? 0} />
              </td>
              <td className="py-3 px-4">{transaction.currency ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
