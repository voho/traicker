import { v4 as uuidv4 } from 'uuid'
import { getDb, type CustomContext } from '~/globals'
import { getLoggedUserOrFail } from '~/backend/assert/getLoggedUserOrFail'
import { ensureUser } from '~/backend/user/ensureUser'

type Params = { context: CustomContext }

type HierCat = {
  title: string
  emoji?: string
  color?: string
  description?: string
  children?: HierCat[]
}

const DEFAULT_CATEGORY_TREE: HierCat[] = [
  {
    title: 'Potraviny', emoji: '🛒', color: '#22c55e', description: 'Nákupy jídla, nápojů a drogerie pro domácnost.', children: [
      { title: 'Supermarket', emoji: '🛍️', description: 'Běžné týdenní nákupy potravin a potřeb.' },
      { title: 'Drogerie', emoji: '🧴', description: 'Hygienické a úklidové potřeby.' },
      { title: 'Pečivo', emoji: '🥖', description: 'Chléb, rohlíky a další pečivo.' },
      { title: 'Ovoce a zelenina', emoji: '🍎', description: 'Čerstvé ovoce a zelenina.' },
    ]
  },
  {
    title: 'Stravování', emoji: '🍽️', color: '#ef4444', description: 'Jídlo a pití mimo domov.', children: [
      { title: 'Káva', emoji: '☕', description: 'Kavárny a teplé nápoje.' },
      { title: 'Oběd', emoji: '🍛', description: 'Denní menu, kantýny a restaurace.' },
      { title: 'Večeře', emoji: '🍝', description: 'Večerní jídla v restauracích.' },
      { title: 'Fastfood', emoji: '🍔', description: 'Rychlé občerstvení a řetězce.' },
    ]
  },
  {
    title: 'Bydlení', emoji: '🏠', color: '#8b5cf6', description: 'Náklady na bydlení a související služby.', children: [
      { title: 'Nájem / Hypotéka', emoji: '🏦', description: 'Nájemné a splátky hypotéky.' },
      { title: 'Energie', emoji: '🔌', description: 'Elektřina a plyn.' },
      { title: 'Internet', emoji: '🌐', description: 'Internet a související služby.' },
      { title: 'Voda', emoji: '💧', description: 'Vodné a stočné.' },
      { title: 'Poplatky', emoji: '🧾', description: 'SVJ, fond oprav a další poplatky.' },
    ]
  },
  { title: 'Doprava', emoji: '🚆', color: '#0ea5e9', description: 'Veřejná doprava, dálkové cesty a taxi.', children: [
      { title: 'MHD', emoji: '🚋', description: 'Městská hromadná doprava.' },
      { title: 'Vlak / Autobus', emoji: '🚆', description: 'Meziměstská doprava.' },
      { title: 'Taxi', emoji: '🚖', description: 'Taxi a sdílené jízdy.' }
    ]
  },
  { title: 'Auto', emoji: '🚗', color: '#f59e0b', description: 'Provoz, servis a pojištění automobilu.', children: [
      { title: 'Palivo', emoji: '⛽', description: 'Pohonné hmoty a nabíjení.' },
      { title: 'Servis', emoji: '🛠️', description: 'Údržba, opravy a STK.' },
      { title: 'Pojištění', emoji: '🛡️', description: 'Povinné ručení a havarijní.' },
      { title: 'Parkování', emoji: '🅿️', description: 'Parkovné a garáže.' }
    ]
  },
  { title: 'Zdraví', emoji: '💊', color: '#f43f5e', description: 'Zdravotní péče a léky.', children: [
      { title: 'Léky', emoji: '💊', description: 'Léky a doplňky stravy.' },
      { title: 'Lékař', emoji: '🩺', description: 'Lékařské služby a poplatky.' },
      { title: 'Zubař', emoji: '🦷', description: 'Stomatologická péče.' }
    ]
  },
  { title: 'Oblečení', emoji: '👕', color: '#a855f7', description: 'Oblečení, obuv a doplňky.', children: [
      { title: 'Obuv', emoji: '👟', description: 'Boty a příslušenství.' },
      { title: 'Oblečení', emoji: '👗', description: 'Oblečení a doplňky.' }
    ]
  },
  { title: 'Domácnost', emoji: '🧹', color: '#10b981', description: 'Vybavení, úklid a provoz domácnosti.', children: [
      { title: 'Čisticí prostředky', emoji: '🧼', description: 'Úklidové a prací prostředky.' },
      { title: 'Dekorace', emoji: '🖼️', description: 'Bytové doplňky a dekorace.' },
      { title: 'Opravy a údržba', emoji: '🧰', description: 'Opravy, nářadí a materiál.' }
    ]
  },
  { title: 'Volný čas', emoji: '🎉', color: '#f97316', description: 'Zábava, sport a koníčky.', children: [
      { title: 'Sport', emoji: '🏋️', description: 'Vybavení, vstupy a sportovní aktivity.' },
      { title: 'Kultura', emoji: '🎭', description: 'Kino, divadlo, koncerty a výstavy.' },
      { title: 'Předplatné', emoji: '💡', description: 'Digitální služby a další předplatné.' }
    ]
  },
  { title: 'Cestování', emoji: '✈️', color: '#3b82f6', description: 'Cesty, dovolené a výlety.', children: [
      { title: 'Ubytování', emoji: '🛏️', description: 'Hotely, penziony a další ubytování.' },
      { title: 'Doprava', emoji: '🚌', description: 'Doprava na cestách a půjčovny.' },
      { title: 'Jídlo', emoji: '🍜', description: 'Stravování na cestách.' }
    ]
  },
  { title: 'Děti', emoji: '👶', color: '#ec4899', description: 'Výdaje související s dětmi.', children: [
      { title: 'Školka / Škola', emoji: '🏫', description: 'Školné, družina a školní pomůcky.' },
      { title: 'Hračky', emoji: '🧸', description: 'Hračky, hry a zábava.' },
      { title: 'Oblečení', emoji: '🧥', description: 'Dětské oblečení a obuv.' }
    ]
  },
  { title: 'Vzdělávání', emoji: '🎓', color: '#6366f1', description: 'Kurzy, školení a studium.', children: [
      { title: 'Kurzy', emoji: '🧑‍🏫', description: 'Kurzy, workshopy a školení.' },
      { title: 'Knihy', emoji: '📚', description: 'Knihy a studijní materiály.' }
    ]
  },
  { title: 'Dárky', emoji: '🎁', color: '#eab308', description: 'Dárky a oslavy.', children: [
      { title: 'Rodina', emoji: '👪', description: 'Dárky pro rodinu.' },
      { title: 'Přátelé', emoji: '👥', description: 'Dárky pro přátele.' }
    ]
  },
  { title: 'Finanční služby', emoji: '💳', color: '#64748b', description: 'Bankovní a další finanční služby.', children: [
      { title: 'Bankovní poplatky', emoji: '🧾', description: 'Poplatky bank a směny.' },
      { title: 'Pojištění', emoji: '🛡️', description: 'Životní a majetkové pojištění.' }
    ]
  },
  { title: 'Příjmy', emoji: '💰', color: '#16a34a', description: 'Příchozí platby a výdělky.', children: [
      { title: 'Výplata', emoji: '💼', description: 'Mzda, honoráře a pravidelné příjmy.' },
      { title: 'Bonus', emoji: '🎉', description: 'Bonusy a prémie.' },
      { title: 'Ostatní příjmy', emoji: '💵', description: 'Jednorázové či ostatní příjmy.' }
    ]
  },
]

export const resetCategories = async ({ context }: Params) => {
  const db = getDb(context)
  const userId = getLoggedUserOrFail(context)

  await ensureUser({ context })

  const now = new Date().toISOString()

  // 1) Nullify categories on events
  await db
    .updateTable('event')
    .set({
      category_id: null,
      updated_at: now,
    })
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .execute()

  // 2) Soft-delete all user's categories
  await db
    .updateTable('category')
    .set({ deleted_at: now, updated_at: now })
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .execute()

  // 3) Recreate default categories with hierarchy using BFS
  type QueueItem = { node: HierCat; parentId: string | null }
  const queue: QueueItem[] = []
  for (const root of DEFAULT_CATEGORY_TREE) queue.push({ node: root, parentId: null })

  let created = 0
  while (queue.length > 0) {
    const { node, parentId } = queue.shift()!
    const id = uuidv4()
    await db
      .insertInto('category')
      .values({
        category_id: id,
        user_id: userId,
        title: node.title,
        emoji: node.emoji ?? null,
        color: node.color ?? null,
        description: node.description ?? null,
        parent_category_id: parentId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      })
      .execute()
    created++

    for (const child of node.children ?? []) {
      queue.push({ node: child, parentId: id })
    }
  }

  return { success: true, created }
}
