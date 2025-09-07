import type { CustomContext } from "~/globals";
import { getDb } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
};

export const getCategories = async ({ context }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const rows = await db
    .selectFrom("category")
    .select([
      "category_id",
      "title",
      "parent_category_id",
      "emoji",
      "color",
      "description",
    ])
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .orderBy("title", "asc")
    .execute();

  // Build lookup for inheritance
  const byId = new Map(rows.map(r => [r.category_id, r] as const));

  const resolveInherited = (id: string) => {
    let cur = byId.get(id);
    let emoji: string | undefined = cur?.emoji ?? undefined;
    let color: string | undefined = cur?.color ?? undefined;
    const visited = new Set<string>();
    while ((emoji == null || color == null) && cur?.parent_category_id) {
      if (visited.has(cur.parent_category_id)) break; // guard cycles
      visited.add(cur.parent_category_id);
      const parent = byId.get(cur.parent_category_id);
      if (!parent) break;
      if (emoji == null && parent.emoji) emoji = parent.emoji;
      if (color == null && parent.color) color = parent.color;
      cur = parent;
    }
    return { emoji, color };
  };

  return {
    categories: rows.map((it) => {
      const inherited = resolveInherited(it.category_id);
      return {
        categoryId: it.category_id,
        parentCategoryId: it.parent_category_id ?? undefined,
        title: it.title,
        emoji: (it.emoji ?? inherited.emoji) ?? undefined,
        color: (it.color ?? inherited.color) ?? undefined,
        description: it.description ?? undefined,
      };
    }),
  };
};
