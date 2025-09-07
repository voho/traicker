import {hc} from 'hono/client'
import {QueryClient} from "@tanstack/react-query";
import type {AppType} from "../workers/app";
import OpenAI from 'openai';
import {type Context} from "hono";
import {Kysely} from 'kysely';
import {D1Dialect} from 'kysely-d1';
import type {DB} from './backend/db';
import {createClerkClient} from "@clerk/backend";

export type CustomContext = Context<{ Bindings: Env }>

export const queryClient = new QueryClient()

// this is a trick to calculate the type when compiling
export type Client = ReturnType<typeof hc<AppType>>

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args)

export const apiClient = hcWithType("/")

export const getAiClient = async (context: CustomContext) => new OpenAI({apiKey: context.env.LOCAL_OPENAI_SECRET_KEY ?? await context.env.OPENAI_SECRET_KEY.get()});

export const getDb = (context: CustomContext) => new Kysely<DB>({dialect: new D1Dialect({database: context.env.DB})});

export const getClerkClient = async (context: CustomContext) => createClerkClient({
    secretKey: context.env.LOCAL_CLERK_SECRET_KEY ?? await context.env.CLERK_SECRET_KEY.get()
});