type Params<T> = {
  payload: T
  prompt: string
  generatedAt: Date
}

export type AiResult<T> = {
  ai: {
    generatedAtIso: string,
    prompt: string
  },
  payload: T
}

export type AiStringResult = AiResult<string>

export const getAiResult =<T> ({payload, prompt, generatedAt}: Params<T>): AiResult<T> => {
    return {
        ai: {
          generatedAtIso: generatedAt.toISOString(),
          prompt,
        },
        payload
    }

}