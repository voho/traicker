import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "~/components/ui/Modal";
import { apiClient } from "~/globals";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  title?: string;
};

export function DeleteCategoryModal({ isOpen, onClose, categoryId, title }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiClient.api.category[":categoryId"].$delete({ param: { categoryId } });
      if (!res.ok) {
        throw await res.json();
      }
      return await res.json();
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
      title="Smazat kategorii"
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
            Smazat
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-gray-200">
        <p>
          Opravdu chcete smazat kategorii {title ? <strong>„{title}“</strong> : "?"}
          ?
        </p>
        <p className="text-gray-400">
          Dojde k odstranění všech vazeb událostí na tuto kategorii. Samotné
          události zůstanou zachovány. Kategorii můžete později vytvořit znovu.
        </p>
      </div>
    </Modal>
  );
}

