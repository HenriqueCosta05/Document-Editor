import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { EndpointBuilder, QueryDefinition, MutationDefinition, InfiniteQueryDefinition } from "@reduxjs/toolkit/query";
import type { BaseAPI as BaseAPIType, Endpoint } from "../@types/api";
import type { BaseSchema } from "../@types/schema";

type DynamicBaseQuery = ReturnType<typeof fetchBaseQuery>;
// ReducerPath must stay tied to `Name`, not widened to `string` — otherwise
// `createApi`'s own ReducerPath generic unifies to `string` too, and every
// api slice collapses into the same generic index signature in the redux
// store's `reducer` map (see store.ts).
type DynamicBuilder<Name extends string> = EndpointBuilder<DynamicBaseQuery, string, Name>;

/**
 * Maps each endpoint `name` (must match a `name` in `BaseAPIType["endpoints"]`)
 * to the concrete result/arg types it produces, plus which RTK Query
 * definition kind it is (must match that endpoint's `type` in the config).
 * Callers supply this so the generated `use<Name>Query`/`use<Name>Mutation`
 * hooks stay typed instead of collapsing to `unknown`.
 */
export type EndpointTypeMap = Record<
  string,
  { result: unknown; arg?: unknown; kind?: "query" | "mutation" | "infiniteQuery" }
>;

type TypedDefinition<T extends EndpointTypeMap, K extends keyof T> = T[K] extends { kind: "mutation" }
  ? MutationDefinition<T[K]["arg"], DynamicBaseQuery, string, T[K]["result"], string>
  : T[K] extends { kind: "infiniteQuery" }
    ? InfiniteQueryDefinition<T[K]["arg"], unknown, DynamicBaseQuery, string, T[K]["result"], string>
    : QueryDefinition<T[K]["arg"], DynamicBaseQuery, string, T[K]["result"], string>;

type TypedDefinitions<T extends EndpointTypeMap> = {
  [K in keyof T]: TypedDefinition<T, K>;
};

type UntypedDefinition =
  | QueryDefinition<unknown, DynamicBaseQuery, string, unknown, string>
  | MutationDefinition<unknown, DynamicBaseQuery, string, unknown, string>
  | InfiniteQueryDefinition<unknown, unknown, DynamicBaseQuery, string, unknown, string>;

/**
 * Base API is a Factory for new API declarations and must be used for:
 * 1. Align code practices implemented in this template
 * 2. Abstract redux implementation into a single file
 *
 * The endpoint list is only known at runtime (driven by `api.endpoints`), so
 * the definitions are necessarily built with `unknown` internally. The
 * result is cast once, at the boundary, to `TypedDefinitions<T>` using the
 * `T` the caller supplies — the same config author is responsible for
 * keeping `T`'s keys/kind in sync with `api.endpoints`.
 *
 * `Name` is captured as a `const` generic so `reducerPath` stays a literal
 * type (eg. `"dashboard"`) instead of widening to `string` — required for
 * `configureStore`'s `reducer` map to key multiple api slices correctly.
 */
export const BaseAPI = <T extends EndpointTypeMap, const Name extends string = string>(
  api: BaseAPIType,
  entity: BaseSchema & { name: Name },
) => {
  const endpoints = api.endpoints ?? [];

  return createApi({
    reducerPath: entity.name,
    baseQuery: fetchBaseQuery({ baseUrl: api.baseURL }),
    endpoints: (build: DynamicBuilder<Name>) =>
      endpoints.reduce<Record<string, UntypedDefinition>>((acc, endpoint: Endpoint) => {
        switch (endpoint.type) {
          case "query":
            acc[endpoint.name] = build.query<unknown, unknown>({
              // String args are treated as a prefix to `path` (eg. config
              // `path: ".json"` + arg `"dark"` -> "dark.json"), letting one
              // endpoint serve a dynamic resource name. Anything else is
              // sent as the query string.
              query: (arg: unknown) =>
                typeof arg === "string"
                  ? `${arg}${endpoint.path}`
                  : { url: endpoint.path, params: arg ?? endpoint.params },
            });
            break;

          case "mutation":
            acc[endpoint.name] = build.mutation<unknown, unknown>({
              query: (params: unknown) => ({
                url: endpoint.path,
                method: endpoint.method ?? "POST",
                body: params ?? endpoint.params,
              }),
            });
            break;

          case "infiniteQuery":
            acc[endpoint.name] = build.infiniteQuery<unknown, unknown, unknown>({
              query: ({ pageParam }: { pageParam: unknown }) => ({
                url: endpoint.path,
                params: { pageParam },
              }),
              infiniteQueryOptions: {
                initialPageParam: endpoint.initialPageParam,
                getNextPageParam: (lastPage: unknown, allPages: unknown[]) =>
                  endpoint.getNextPageParam(lastPage, allPages),
              },
            });
            break;
        }

        return acc;
      }, {}) as TypedDefinitions<T>,
  });
};