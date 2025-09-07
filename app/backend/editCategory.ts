import { getDb, type CustomContext } from "~/globals";
import { getLoggedUserOrFail } from "~/backend/assert/getLoggedUserOrFail";
import { categoryInputSchema } from "~/schemas/category";
import { NotFoundError } from "./errors/NotFoundError";

type Params = {
  context: CustomContext;
  categoryId: string;
  input: unknown;
};

export const editCategory = async ({ context, categoryId, input }: Params) => {
  const db = getDb(context);
  const userId = getLoggedUserOrFail(context);

  const parsed = categoryInputSchema.parse(input);

  const existing = await db
    .selectFrom("category")
    .select(["category_id"]) // minimal
    .where("category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!existing) {
    throw new NotFoundError("Category not found");
  }

  await db
    .updateTable("category")
    .set({
      updated_at: new Date().toISOString(),
      parent_category_id: parsed.parentCategoryId ?? null,
      title: parsed.title,
      emoji: parsed.emoji ?? null,
      color: parsed.color ?? null,
      description: parsed.description ?? null,
    })
    .where("category_id", "=", categoryId)
    .where("user_id", "=", userId)
    .execute();

  return { success: true };
};

