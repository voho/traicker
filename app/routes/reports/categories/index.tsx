import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "~/globals";
import { CategoryTree } from "./components/CategoryTree";
import { AddCategoryModal } from "./components/AddCategoryModal";
import { ResetCategoriesConfirmModal } from "./components/ResetCategoriesConfirmModal";
import type { InferResponseType } from "hono";

type Category = NonNullable<
  InferResponseType<typeof apiClient.api.categories.$get>
>["categories"][number];

export default function Categories() {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => apiClient.api.categories.$get().then((r) => r.json()),
  });
  const [isAddOpen, setAddOpen] = useState(false);
  const [isResetOpen, setResetOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategorie</h1>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            title="Obnoví výchozí kategorie a vymaže přiřazení u záznamů"
          >
            Výchozí
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Přidat kategorii
          </button>
        </div>
      </div>
      {isError && (
        <p className="text-red-400">Nepodařilo se načíst kategorie.</p>
      )}
      {isFetching && <p className="text-gray-400">Načítání…</p>}
      <CategoryTree categories={data} />
      <AddCategoryModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        categories={(data?.categories ?? []).map((c: Category) => ({
          categoryId: c.categoryId,
          title: c.title,
        }))}
      />
      <ResetCategoriesConfirmModal isOpen={isResetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}
