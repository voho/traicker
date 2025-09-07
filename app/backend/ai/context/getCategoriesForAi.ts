import type { CustomContext } from "~/globals";
import { getDb } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
};

// Fetches user's categories and returns a JSON string with
// id, parentId, name, description for each category.
export const getCategoriesForAi = async ({ context }: Params): Promise<string> => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const rows = await db
    .selectFrom("category")
    .select([
      "category_id",
      "parent_category_id",
      "title",
      "description",
    ])
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .orderBy("title", "asc")
    .execute();

  const categories = rows.map((r) => ({
    id: r.category_id,
    parentId: r.parent_category_id ?? undefined,
    name: r.title,
    description: r.description ?? undefined,
  }));

  return JSON.stringify(categories);
};

