import { PriceDisplay } from '~/routes/reports/components/PriceDisplay';
import type {InferResponseType} from "hono";
import {apiClient} from "~/globals";
import { RiRobotLine } from "react-icons/ri";
import { FiEdit3 } from "react-icons/fi";

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
            <th className="py-3 px-4 text-right">Datum</th>
            <th className="py-3 px-4 text-left">Popis</th>
            <th className="py-3 px-4 text-right">Částka</th>
            <th className="py-3 px-4 text-left">Měna</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
              <td className="py-3 px-4 text-right">
                <span className="inline-flex items-center gap-2 justify-end">
                  {transaction.aiModel === 'manual' ? (
                    <FiEdit3 className="w-4 h-4 text-gray-400" aria-label="Manuální záznam" />
                  ) : (
                    <RiRobotLine className="w-4 h-4 text-gray-400" aria-label="AI záznam" />
                  )}
                  <span>{transaction.dateIso ? new Date(transaction.dateIso).toLocaleDateString('cs-CZ') : '-'}</span>
                </span>
              </td>
              <td className="py-3 px-4">{transaction.item ?? '-'}{
                transaction.explanationText ? (
                    <p className={"text-xs text-gray-500"}>{transaction.explanationText} </p>
                ) : <></>
              }{
                (transaction.explanationConfidence !== undefined && transaction.explanationConfidence !== 1) ? (
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
