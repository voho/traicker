import {getAuth} from "@hono/clerk-auth";
import type {CustomContext} from "~/globals";

export const getLoggedUserOrFail = (context: CustomContext) => {
    const auth = getAuth(context)
    if (!auth || !auth.isAuthenticated || !auth.userId) {
        throw new Error("User is not logged in")
    }
    return auth.userId
}