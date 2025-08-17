import type {PagingRequest} from "~/backend/types";

export const getPagedResult =<T> (paging: PagingRequest, count: number, payload: T[]) => {
    return {
        paging: {
            page: paging.page,
            pageSize: paging.pageSize,
            pageCount: Math.ceil(count / paging.pageSize),
            totalCount: count
        },
        payload
    }

}