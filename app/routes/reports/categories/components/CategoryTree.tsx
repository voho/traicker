import type { InferResponseType } from "hono";
import { useState } from "react";
import { apiClient } from "~/globals";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { EditCategoryModal } from "./EditCategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";

type Category = NonNullable<
  InferResponseType<typeof apiClient.api.categories.$get>
>["categories"][number];

type Props = {
  // Be flexible: accept either the API response shape or a plain array
  categories?: { categories: Category[] } | Category[];
};

export const CategoryTree = ({ categories }: Props) => {
  const [editState, setEditState] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [deleteState, setDeleteState] = useState<{ open: boolean; category?: Category }>({ open: false });
  const list: Category[] = Array.isArray(categories)
    ? categories
    : categories?.categories ?? [];

  if (!list.length) {
    return (
      <div className="text-sm text-gray-500">
        Žádné kategorie k zobrazení.
      </div>
    );
  }

  // Group categories by parentCategoryId for efficient lookup
  const childrenByParent = new Map<string | undefined, Category[]>();
  for (const cat of list) {
    const key = cat.parentCategoryId; // undefined => root
    const arr = childrenByParent.get(key) ?? [];
    arr.push(cat);
    childrenByParent.set(key, arr);
  }

  const renderBranch = (parentId: string | undefined) => {
    const children = childrenByParent.get(parentId) ?? [];
    if (children.length === 0) return null;

    return (
      <section className="flex flex-col gap-4">
        {children.map((cat) => (
          <div
            key={cat.categoryId}
            className="py-2 px-5 border border-white/10 rounded-xl bg-white/5 hover:border-white/20 transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-white/10 flex-shrink-0"
                style={{ background: cat.color ?? 'transparent' }}
                aria-hidden
              >
                {cat.emoji ? (
                  <span className="text-base leading-none">{cat.emoji}</span>
                ) : (
                  <span className="sr-only">Bez emoji</span>
                )}
              </span>
              <div className="min-w-0">
                <div
                  className="font-semibold text-lg truncate"
                  title={cat.description ?? cat.title}
                >
                  {cat.title}
                </div>
                {cat.description ? (
                  <div className="text-sm text-gray-400 truncate">{cat.description}</div>
                ) : null}
              </div>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  className="p-1 rounded-md border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white bg-transparent transition-colors"
                  aria-label="Upravit kategorii"
                  onClick={() => setEditState({ open: true, category: cat })}
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded-md border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white bg-transparent transition-colors"
                  aria-label="Smazat kategorii"
                  onClick={() => setDeleteState({ open: true, category: cat })}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {renderBranch(cat.categoryId)}
          </div>
        ))}
      </section>
    );
  };

  // Start from root (undefined parent)
  return (
    <div>
      {renderBranch(undefined)}
      <EditCategoryModal
        isOpen={editState.open}
        onClose={() => setEditState({ open: false })}
        initial={editState.category && {
          categoryId: editState.category.categoryId,
          title: editState.category.title,
          parentCategoryId: editState.category.parentCategoryId,
          emoji: editState.category.emoji,
          color: editState.category.color,
          description: editState.category.description,
        }}
        categories={list.map((c) => ({ categoryId: c.categoryId, title: c.title }))}
      />
      <DeleteCategoryModal
        isOpen={deleteState.open}
        onClose={() => setDeleteState({ open: false })}
        categoryId={deleteState.category?.categoryId ?? ""}
        title={deleteState.category?.title}
      />
    </div>
  );
};
