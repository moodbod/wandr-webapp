import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { FunctionReference } from "convex/server";
import type { EmptyObject } from "convex-helpers";

type AuthServer = ReturnType<typeof convexBetterAuthNextJs>;

const missingConfig = [
  !process.env.NEXT_PUBLIC_CONVEX_URL && "NEXT_PUBLIC_CONVEX_URL",
  !process.env.NEXT_PUBLIC_CONVEX_SITE_URL && "NEXT_PUBLIC_CONVEX_SITE_URL",
].filter(Boolean) as string[];

const authConfigError =
  missingConfig.length > 0
    ? `Missing required Next.js env var${missingConfig.length > 1 ? "s" : ""}: ${missingConfig.join(
        ", ",
      )}.`
    : null;

let authServer: AuthServer | null = null;

function getAuthServer() {
  if (authConfigError) {
    return null;
  }

  authServer ??= convexBetterAuthNextJs({
    convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  });

  return authServer;
}

function getAuthServerOrThrow() {
  const server = getAuthServer();
  if (!server) {
    throw new Error(
      `${authConfigError} In production on Vercel, use 'npx convex deploy --cmd "npm run build"' and set NEXT_PUBLIC_CONVEX_SITE_URL to your .convex.site URL.`,
    );
  }
  return server;
}

type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
type ActionRef = FunctionReference<"action">;
type OptionalArgs<FuncRef extends FunctionReference<any, any>> =
  FuncRef["_args"] extends EmptyObject
    ? [args?: EmptyObject]
    : [args: FuncRef["_args"]];

export async function getToken() {
  const server = getAuthServer();
  return server ? (await server.getToken()) ?? null : null;
}

export async function isAuthenticated() {
  const server = getAuthServer();
  return server ? server.isAuthenticated() : false;
}

export async function preloadAuthQuery<Query extends QueryRef>(
  query: Query,
  ...args: OptionalArgs<Query>
) {
  return getAuthServerOrThrow().preloadAuthQuery(query, ...args);
}

export async function fetchAuthQuery<Query extends QueryRef>(
  query: Query,
  ...args: OptionalArgs<Query>
) {
  return getAuthServerOrThrow().fetchAuthQuery(query, ...args);
}

export async function fetchAuthMutation<Mutation extends MutationRef>(
  mutation: Mutation,
  ...args: OptionalArgs<Mutation>
) {
  return getAuthServerOrThrow().fetchAuthMutation(mutation, ...args);
}

export async function fetchAuthAction<Action extends ActionRef>(
  action: Action,
  ...args: OptionalArgs<Action>
) {
  return getAuthServerOrThrow().fetchAuthAction(action, ...args);
}

function authMisconfiguredResponse() {
  return Response.json(
    {
      error:
        authConfigError ??
        "Authentication is unavailable because the deployment is misconfigured.",
    },
    { status: 503 },
  );
}

type HandlerMethod = AuthServer["handler"]["GET"];

export const handler: {
  GET: (...args: Parameters<HandlerMethod>) => ReturnType<HandlerMethod>;
  POST: (...args: Parameters<HandlerMethod>) => ReturnType<HandlerMethod>;
} = {
  GET: (...args) => {
    const server = getAuthServer();
    return server
      ? server.handler.GET(...args)
      : Promise.resolve(authMisconfiguredResponse());
  },
  POST: (...args) => {
    const server = getAuthServer();
    return server
      ? server.handler.POST(...args)
      : Promise.resolve(authMisconfiguredResponse());
  },
};
