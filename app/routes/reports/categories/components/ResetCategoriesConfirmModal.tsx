import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "~/components/ui/Modal";
import { apiClient } from "~/globals";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ResetCategoriesConfirmModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiClient.api["reset-categories"].$post();
      if (!res.ok) throw new Error("Nepodařilo se resetovat kategorie");
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Obnovit výchozí kategorie"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg bg-transparent transition-colors"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
            className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-60"
          >
            Obnovit výchozí
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-gray-200">
        <p>
          Opravdu chcete obnovit výchozí kategorie?
        </p>
        <p className="text-gray-400">
          Dojde k odstranění všech vašich kategorií (budou nahrazeny výchozí strukturou)
          a u všech záznamů bude kategorie vymazána. Poté se vytvoří přehledná sada
          výchozích kategorií pro český trh.
        </p>
      </div>
    </Modal>
  );
}

