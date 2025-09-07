import { getDb, type CustomContext } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { NotFoundError } from "./errors/NotFoundError";

type Params = {
  context: CustomContext;
  categoryId: string;
};

// Removes all event_category entries for the category, then soft-deletes the category itself
export const deleteCategory = async ({ context, categoryId }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  // Ensure the category exists and belongs to the current user
  const existing = await db
    .selectFrom("category")
    .select(["category_id", "parent_category_id"]) // minimal
    .where("category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!existing) {
    throw new NotFoundError("Category not found");
  }

  // Re-parent direct children to the deleted category's parent
  await db
    .updateTable("category")
    .set({
      parent_category_id: existing.parent_category_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .where("parent_category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .execute();

  // Remove all event-category links for this category (hard delete is fine for link table)
  await db
    .deleteFrom("event_category")
    .where("category_id", "=", categoryId)
    .execute();

  // Soft delete the category record
  await db
    .updateTable("category")
    .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .where("category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .execute();

  return { success: true };
};
