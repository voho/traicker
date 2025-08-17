export type PagingRequest = {
    page: number
    pageSize: number
}

export type PagingResponse = {
    page: number
    pageSize: number
    pageCount: number
    totalCount: number
}

export type PagedResult<T> = {
    payload: T[],
    paging: PagingResponse
}