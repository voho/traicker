import {Hono} from "hono";
import {clerkMiddleware} from '@hono/clerk-auth';
import {createRequestHandler} from "react-router";
import {timeout} from 'hono/timeout'
import {secureHeaders} from 'hono/secure-headers'
import {storeEvent} from "~/backend/storeEvent";

const app = new Hono<{ Bindings: Env }>()
    .use(secureHeaders())
    .use('/api/*', timeout(30000))
    .use('/api/*', async (c, next) => {
        const middleware = clerkMiddleware({
            secretKey: c.env.LOCAL_CLERK_SECRET_KEY ?? await c.env.CLERK_SECRET_KEY.get(),
            publishableKey: c.env.LOCAL_CLERK_PUBLISHABLE_KEY ?? await c.env.CLERK_PUBLISHABLE_KEY.get()
        })
        return middleware(c, next)
    })
    .post('/api/store',async (context) => {
        const request = await context.req.json()
        console.log("req", request)
        await storeEvent({context, prompt: request.prompt})
        return context.json({success: true});
    }).get("*", (c) => {
        const requestHandler = createRequestHandler(
            () => import("virtual:react-router/server-build"),
            import.meta.env.MODE,
        );

        return requestHandler(c.req.raw, {
            cloudflare: {env: c.env, ctx: c.executionCtx},
        });
    });

export type AppType = typeof app

export default app;
