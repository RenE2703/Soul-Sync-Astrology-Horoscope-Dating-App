/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as files from "../files.js";
import type * as lib_compatibility from "../lib/compatibility.js";
import type * as lib_distance from "../lib/distance.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_photos from "../lib/photos.js";
import type * as lib_utils from "../lib/utils.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as sampleData_demoProfiles from "../sampleData/demoProfiles.js";
import type * as seed from "../seed.js";
import type * as swipes from "../swipes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  files: typeof files;
  "lib/compatibility": typeof lib_compatibility;
  "lib/distance": typeof lib_distance;
  "lib/openai": typeof lib_openai;
  "lib/photos": typeof lib_photos;
  "lib/utils": typeof lib_utils;
  matches: typeof matches;
  messages: typeof messages;
  "sampleData/demoProfiles": typeof sampleData_demoProfiles;
  seed: typeof seed;
  swipes: typeof swipes;
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
