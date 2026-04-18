import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from "@convex-dev/auth/nextjs/server";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import type { FunctionReference, FunctionReturnType } from "convex/server";

type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
type ActionRef = FunctionReference<"action">;

function getAuthFetchOptions(token: string | undefined) {
  return token ? { token } : undefined;
}

export async function getToken() {
  return (await convexAuthNextjsToken()) ?? null;
}

export async function isAuthenticated() {
  return await isAuthenticatedNextjs();
}

export async function fetchAuthQuery<Query extends QueryRef>(
  query: Query,
  args?: Query["_args"],
): Promise<FunctionReturnType<Query>> {
  const token = await convexAuthNextjsToken();
  return await fetchQuery(
    query,
    (args ?? {}) as Query["_args"],
    getAuthFetchOptions(token),
  );
}

export async function fetchAuthMutation<Mutation extends MutationRef>(
  mutation: Mutation,
  args?: Mutation["_args"],
): Promise<FunctionReturnType<Mutation>> {
  const token = await convexAuthNextjsToken();
  return await fetchMutation(
    mutation,
    (args ?? {}) as Mutation["_args"],
    getAuthFetchOptions(token),
  );
}

export async function fetchAuthAction<Action extends ActionRef>(
  action: Action,
  args?: Action["_args"],
): Promise<FunctionReturnType<Action>> {
  const token = await convexAuthNextjsToken();
  return await fetchAction(
    action,
    (args ?? {}) as Action["_args"],
    getAuthFetchOptions(token),
  );
}
