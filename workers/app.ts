import {Hono} from "hono";
import {clerkMiddleware} from '@hono/clerk-auth';
import {createRequestHandler} from "react-router";
import {timeout} from 'hono/timeout'
import {secureHeaders} from 'hono/secure-headers'
import {storeEvent} from "~/backend/event/storeEvent";
import {storeManualEvent} from "~/backend/event/storeManualEvent";
import { deleteEvent } from "~/backend/event/deleteEvent";
import { editEvent } from "~/backend/event/editEvent";
import { ZodError } from 'zod'
import {getEvents} from "~/backend/event/getEvents";
import {getMonthlySummary} from "~/backend/report/getMonthlySummary";
import { getMonthlySummaryTrendPerCategory } from "~/backend/report/getMonthlySummaryTrendPerCategory";
import { getMonthlySummaryPerCategory } from "~/backend/report/getMonthlySummaryPerCategory";
import { getMonthlyTipFromAi } from "~/backend/ai/getMonthlyTipFromAi";
import { getCategories } from "~/backend/category/getCategories";
import { addCategory } from "~/backend/category/addCategory";
import { editCategory } from "~/backend/category/editCategory";
import { categorizeEvents } from "~/backend/event/categorizeEvents";
import { resetCategories } from "~/backend/category/resetCategories";
import { deleteCategory } from "~/backend/category/deleteCategory";

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
    .get('/api/categories', async (context) => {
        const categories = await getCategories({ context })
        return context.json(categories)
    })
    .post('/api/categorize-events', async (context) => {
        try {
            const body = await context.req.json().catch(() => ({})) as { force?: boolean }
            const result = await categorizeEvents({ context, input: { force: Boolean(body?.force) } })
            return context.json(result)
        } catch (e) {
            return context.json({ success: false }, 400)
        }
    })
    .post('/api/reset-categories', async (context) => {
        try {
            const result = await resetCategories({ context })
            return context.json(result)
        } catch (e) {
            return context.json({ success: false }, 400)
        }
    })
    .post('/api/category', async (context) => {
        try {
            const body = await context.req.json()
            const result = await addCategory({ context, input: body })
            return context.json(result)
        } catch (e) {
            if (e instanceof ZodError) {
                return context.json({ success: false, errors: e.flatten() }, 400)
            }
            throw e
        }
    })
    .put('/api/category/:categoryId', async (context) => {
        try {
            const { categoryId } = context.req.param()
            const body = await context.req.json()
            const result = await editCategory({ context, categoryId, input: body })
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
    .delete('/api/category/:categoryId', async (context) => {
        try {
            const { categoryId } = context.req.param()
            const result = await deleteCategory({ context, categoryId })
            return context.json(result)
        } catch (e) {
            // @ts-ignore
            if ((e as any).status === 404) {
                return context.json({ success: false, error: 'Not Found' }, 404)
            }
            throw e
        }
    })
    .get('/api/report/summary/:year/:month', async (context) => {
        const {month, year} = context.req.param()
        const summary = await getMonthlySummary({context, month: parseInt(month), year: parseInt(year)})
        return context.json(summary)
    })
    .get('/api/report/summary-per-category/:year/:month', async (context) => {
        const { month, year } = context.req.param()
        const m = parseInt(month)
        const y = parseInt(year)
        const data = await getMonthlySummaryPerCategory({ context, month: m, year: y })
        return context.json(data)
    })
    .get('/api/report/summary-trend-per-category', async (context) => {
        const trend = await getMonthlySummaryTrendPerCategory({ context })
        return context.json(trend)
    })
    .get('/api/ai/monthly-tip/:year/:month', async (context) => {
        const { month, year } = context.req.param()
        const m = parseInt(month)
        const y = parseInt(year)
        if (!Number.isFinite(m) || !Number.isFinite(y)) {
            return context.json({ success: false, error: 'Invalid year or month' }, 400)
        }
        const tip = await getMonthlyTipFromAi({ context, year: y, month: m })
        return context.json( tip )
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
