/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admins from "../admins.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as budgets from "../budgets.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as liveTrips from "../liveTrips.js";
import type * as places from "../places.js";
import type * as planner from "../planner.js";
import type * as tripStops from "../tripStops.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admins: typeof admins;
  auth: typeof auth;
  bookings: typeof bookings;
  budgets: typeof budgets;
  debug: typeof debug;
  http: typeof http;
  liveTrips: typeof liveTrips;
  places: typeof places;
  planner: typeof planner;
  tripStops: typeof tripStops;
  trips: typeof trips;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
