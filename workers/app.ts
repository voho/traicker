import {Hono} from "hono";
import {clerkMiddleware} from '@hono/clerk-auth';
import {createRequestHandler} from "react-router";
import {timeout} from 'hono/timeout'
import {secureHeaders} from 'hono/secure-headers'
import {storeEvent} from "~/backend/storeEvent";
import {storeManualEvent} from "~/backend/storeManualEvent";
import { ZodError } from 'zod'
import {getEvents} from "~/backend/getEvents";
import {getMonthlySummary} from "~/backend/getMonthlySummary";

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
        try {
            const request = await context.req.json()
            await storeEvent({context, prompt: request.prompt})
            return context.json({success: true});
        } catch (e) {
            if (e instanceof ZodError) {
                return context.json({success: false, errors: e.flatten()}, 400)
            }
            throw e
        }
    })
    .post('/api/store-manual', async (context) => {
        try {
            const request = await context.req.json()
            await storeManualEvent({ context, input: request })
            return context.json({success: true});
        } catch (e) {
            if (e instanceof ZodError) {
                return context.json({success: false, errors: e.flatten()}, 400)
            }
            throw e
        }
    })
    .get('/api/events',async (context) => {
        const events = await getEvents({context, paging: {pageSize: 100, page: 0}})
        return context.json(events);
    })
    .get('/api/report/summary/:year/:month', async (context) => {
        const {month, year} = context.req.param()
        const summary = await getMonthlySummary({context, month: parseInt(month), year: parseInt(year)})
        return context.json(summary)
    })
    .get("*", (c) => {
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
