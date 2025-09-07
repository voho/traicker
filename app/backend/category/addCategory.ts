import { v4 as uuidv4 } from 'uuid'
import { getDb, type CustomContext } from '~/globals'
import { getLoggedUserOrFail } from '~/backend/assert/getLoggedUserOrFail'
import { ensureUser } from '../user/ensureUser'
import { categoryInputSchema } from '~/schemas/category'

type Params = {
  context: CustomContext
  input: unknown
}

export const addCategory = async ({ context, input }: Params) => {
  const db = getDb(context)
  const userId = getLoggedUserOrFail(context)
  const categoryId = uuidv4()

  await ensureUser({ context })

  const parsed = categoryInputSchema.parse(input)

  await db
    .insertInto('category')
    .values({
      category_id: categoryId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      parent_category_id: parsed.parentCategoryId ?? null,
      title: parsed.title,
      emoji: parsed.emoji ?? null,
      color: parsed.color ?? null,
      description: parsed.description ?? null,
    })
    .execute()
}
