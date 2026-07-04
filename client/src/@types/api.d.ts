import type { BaseSchema } from "./schema";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type EndpointBase = {
    name: string;
    path: string;
};

export type QueryEndpoint = EndpointBase & {
    type: "query";
    params?: unknown[];
};

export type MutationEndpoint = EndpointBase & {
    type: "mutation";
    method?: HttpMethod;
    params?: unknown[];
};

export type InfiniteQueryEndpoint = EndpointBase & {
    type: "infiniteQuery";
    initialPageParam: unknown;
    getNextPageParam: (lastPage: unknown, allPages: unknown[]) => unknown;
    params?: unknown[];
};

export type Endpoint = QueryEndpoint | MutationEndpoint | InfiniteQueryEndpoint;

export type BaseAPI = {
    baseURL: string;
    returnType?: "xml" | "json";
    endpoints?: Endpoint[];
    polling?: boolean;
    timeoutInMs?: number;
    schema?: BaseSchema;
}