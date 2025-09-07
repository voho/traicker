import {Hono} from "hono";
import {clerkMiddleware} from '@hono/clerk-auth';
import {createRequestHandler} from "react-router";
import {timeout} from 'hono/timeout'
import {secureHeaders} from 'hono/secure-headers'
import {storeEvent} from "~/backend/storeEvent";
import {storeManualEvent} from "~/backend/storeManualEvent";
import { deleteEvent } from "~/backend/deleteEvent";
import { editEvent } from "~/backend/editEvent";
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
    .delete('/api/event/:eventId', async (context) => {
        try {
            const { eventId } = context.req.param()
            const result = await deleteEvent({ context, eventId })
            return context.json(result)
        } catch (e) {
            // @ts-ignore
            if ((e as any).status === 404) {
                return context.json({ success: false, error: 'Not Found' }, 404)
            }
            throw e
        }
    })
    .put('/api/event/:eventId', async (context) => {
        try {
            const { eventId } = context.req.param()
            const body = await context.req.json()
            const result = await editEvent({ context, eventId, input: body })
            return context.json(result)
        } catch (e) {
            if (e instanceof ZodError) {
                return context.json({ success: false, errors: e.flatten() }, 400)
            }
            // @ts-ignore
            if ((e as any).status === 404) {
                return context.json({ success: false, error: 'Not Found' }, 404)
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
