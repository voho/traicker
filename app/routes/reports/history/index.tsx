import { TransactionList } from "./components/TransactionList";
import { getEvents } from "~/backend/getEvents";
import {useLoaderData, type LoaderFunctionArgs} from "react-router";
import {useQuery} from "@tanstack/react-query";
import {apiClient} from "~/globals";
import type {InferResponseType} from "hono";

export default function HistoryReport() {
  const {data, isFetching} = useQuery({queryKey: ["apiClient.api.events"],
   queryFn: async () => {
     const res =  await apiClient.api.events.$get()
     return await res.json()
   }})
  return <TransactionList transactions={data?.payload?? []} />;
}
