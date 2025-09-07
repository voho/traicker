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


  return { categories: rows.map(it => ({
    categoryId: it.category_id,
    parentCategoryId: it.parent_category_id ?? undefined,
    title: it.title,
    emoji: it.emoji ?? undefined,
    color: it.color ?? undefined,
    description: it.description ?? undefined
  })) };
};

