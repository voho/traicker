import { getDb, type CustomContext } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { NotFoundError } from "../errors/NotFoundError";

type Params = {
  context: CustomContext;
  categoryId: string;
};

export const deleteCategory = async ({ context, categoryId }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  // Ensure the category exists and belongs to the current user

  const existing = await db
    .selectFrom("category")
    .select(["category_id", "parent_category_id"])
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

  // Remove category reference from events that used this category

  await db
    .updateTable("event")
    .set({ category_id: null, updated_at: new Date().toISOString(), ai_category_confidence: null as any, ai_category_explain: null as any, ai_category_model: null as any } as any)
    .where("category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .execute();

  // Soft delete the category record

  await db
    .updateTable("category")
    .set({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .where("category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .execute();
};
