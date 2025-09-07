import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "~/components/ui/Modal";
import { apiClient } from "~/globals";
import { categoryInputSchema } from "~/schemas/category";
import { FavoriteEmojis } from "./FavoriteEmojis";
import { ColorPicker } from "./ColorPicker";

type CategoryInitial = {
  categoryId: string;
  title: string;
  parentCategoryId?: string;
  emoji?: string;
  color?: string;
  description?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: CategoryInitial;
  categories?: { categoryId: string; title: string }[];
};

export function EditCategoryModal({ isOpen, onClose, initial, categories = [] }: Props) {
  const [form, setForm] = useState({
    title: "",
    parentCategoryId: "",
    emoji: "",
    color: "",
    description: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title ?? "",
        parentCategoryId: initial.parentCategoryId ?? "",
        emoji: initial.emoji ?? "",
        color: initial.color ?? "",
        description: initial.description ?? "",
      });
      setFieldErrors({});
      setError(null);
    }
  }, [initial, isOpen]);

  const update = (key: keyof typeof form, val: string) =>
    setForm((f) => {
      const next = { ...f, [key]: val };
      const candidate = {
        title: next.title,
        parentCategoryId: next.parentCategoryId || undefined,
        emoji: next.emoji || undefined,
        color: next.color || undefined,
        description: next.description || undefined,
      };
      const res = categoryInputSchema.safeParse(candidate);
      if (!res.success) {
        setFieldErrors(res.error.flatten().fieldErrors as Record<string, string[]>);
      } else {
        setFieldErrors({});
      }
      return next;
    });

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: {
      categoryId: string;
      body: {
        title: string;
        parentCategoryId?: string;
        emoji?: string;
        color?: string;
        description?: string;
      };
    }) => {
      const parsed = categoryInputSchema.parse(payload.body);
      const res = await apiClient.api.category[":categoryId"].$put({
        param: { categoryId: payload.categoryId },
        json: parsed,
      });
      if (!res.ok) {
        throw await res.json();
      }
      return await res.json();
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upravit kategorii"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg bg-transparent transition-colors"
          >
            Zavřít
          </button>
          <button
            type="submit"
            form="edit-category-form"
            disabled={isPending}
            className="px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
          >
            Uložit změny
          </button>
        </div>
      }
    >
      <form
        id="edit-category-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!initial?.categoryId) return;
          const body = {
            title: form.title.trim(),
            parentCategoryId: form.parentCategoryId || undefined,
            emoji: form.emoji || undefined,
            color: form.color || undefined,
            description: form.description || undefined,
          };
          mutate({ categoryId: initial.categoryId, body });
        }}
        className="grid grid-cols-1 gap-3"
      >
        <div>
          <label className="block text-sm text-gray-300 mb-1">Název</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent"
          />
          {fieldErrors.title && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => update("emoji", e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent"
            />
            <FavoriteEmojis className="mt-2" onSelected={(em) => update("emoji", em)} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Barva</label>
            <ColorPicker className="mt-2" color={form.color || undefined} onSelected={(c) => update("color", c)} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Nadřazená kategorie</label>
          <select
            value={form.parentCategoryId}
            onChange={(e) => update("parentCategoryId", e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-white/30 focus:border-transparent"
          >
            <option value="">(žádná – kořenová)</option>
            {categories
              .filter((c) => c.categoryId !== initial?.categoryId)
              .map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.title}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Popis</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
