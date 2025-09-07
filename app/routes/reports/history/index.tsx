import { TransactionList } from "./components/TransactionList";
import {useQuery} from "@tanstack/react-query";
import {apiClient} from "~/globals";

export default function HistoryReport() {
  const {data, isFetching} = useQuery({
    queryKey: ["event-history"],
    queryFn: () => apiClient.api.events.$get().then(res => res.json())
  })
  return <TransactionList transactions={data?.payload?? []} />;
}
