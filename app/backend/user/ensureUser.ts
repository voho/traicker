import { getDb, type CustomContext } from "~/globals";
import { getLoggedUserOrFail } from "../assert/getLoggedUserOrFail";

type Params = {
  context: CustomContext;
};

export const ensureUser = async ({ context }: Params) => {
  const db = getDb(context);
  const loggedUserId = getLoggedUserOrFail(context);

    await db
      .insertInto("user")
      .values({        user_id: loggedUserId      })
      .onConflict(oc => oc.doNothing())
      .execute();
};
