/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as astrology_api from "../astrology_api.js";
import type * as clear from "../clear.js";
import type * as debug from "../debug.js";
import type * as files from "../files.js";
import type * as force from "../force.js";
import type * as lib_ai_service from "../lib/ai_service.js";
import type * as lib_astrology from "../lib/astrology.js";
import type * as lib_compatibility from "../lib/compatibility.js";
import type * as lib_daily_transits from "../lib/daily_transits.js";
import type * as lib_distance from "../lib/distance.js";
import type * as lib_eastern_astrology from "../lib/eastern_astrology.js";
import type * as lib_geocoding from "../lib/geocoding.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_photos from "../lib/photos.js";
import type * as lib_utils from "../lib/utils.js";
import type * as lib_western_astrology from "../lib/western_astrology.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as sampleData_demoProfiles from "../sampleData/demoProfiles.js";
import type * as seed from "../seed.js";
import type * as swipes from "../swipes.js";
import type * as tarot from "../tarot.js";
import type * as test_vector from "../test_vector.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  astrology_api: typeof astrology_api;
  clear: typeof clear;
  debug: typeof debug;
  files: typeof files;
  force: typeof force;
  "lib/ai_service": typeof lib_ai_service;
  "lib/astrology": typeof lib_astrology;
  "lib/compatibility": typeof lib_compatibility;
  "lib/daily_transits": typeof lib_daily_transits;
  "lib/distance": typeof lib_distance;
  "lib/eastern_astrology": typeof lib_eastern_astrology;
  "lib/geocoding": typeof lib_geocoding;
  "lib/openai": typeof lib_openai;
  "lib/photos": typeof lib_photos;
  "lib/utils": typeof lib_utils;
  "lib/western_astrology": typeof lib_western_astrology;
  matches: typeof matches;
  messages: typeof messages;
  "sampleData/demoProfiles": typeof sampleData_demoProfiles;
  seed: typeof seed;
  swipes: typeof swipes;
  tarot: typeof tarot;
  test_vector: typeof test_vector;
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
