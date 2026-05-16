"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { processLocationAndTime } from "./lib/geocoding";
import { calculateWesternAstrology } from "./lib/western_astrology";
import { calculateEasternAstrology } from "./lib/eastern_astrology";
import { generateAstroAnalysis } from "./lib/ai_service";

/**
 * Core Integration Engine Function
 * Connects Modules 1, 2, w3 into a Raw Astro Data object,
 * and pushes to Module 4 (AI Gateway) to return structured JSON.
 *
 * Now uses CircularNatalHoroscopeJS for accurate natal chart calculations
 * with Dual House System (Placidus + Whole Sign).
 */
export async function generateSoulSyncProfile(
  location: string,
  dateOfBirthTimestamp: number,
  birthTime: string
) {
  // 1. Timezone & Coordinates Processing
  const geoResult = await processLocationAndTime(location, dateOfBirthTimestamp, birthTime);

  // 2. Parse local time components for the new engine
  const dateObj = new Date(dateOfBirthTimestamp);
  const [hoursStr, minutesStr] = birthTime.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // 3. Compute Western Astronomy Data (CircularNatalHoroscopeJS — Moshier Ephemeris)
  const westernData = calculateWesternAstrology(
    dateObj.getFullYear(),
    dateObj.getMonth(),       // 0-indexed
    dateObj.getDate(),
    isNaN(hours) ? 12 : hours,
    isNaN(minutes) ? 0 : minutes,
    geoResult.latitude,
    geoResult.longitude
  );

  // 4. Compute Eastern Astrology Data (Four Pillars & Elements)
  const localDateObj = new Date(geoResult.localDateTimestamp);
  const easternData = calculateEasternAstrology(localDateObj);

  // 5. Combine into complete Raw JSON Object
  const rawAstroData = {
    metadata: {
      birthData: { location, birthTime },
      timezone: geoResult.timezoneId,
      utcTimestamp: geoResult.utcTimeTimestamp,
    },
    westernAstrology: westernData,
    easternAstrology: easternData,
  };

  console.log("Raw Computed Astronomy Data (Feeding to AI):", JSON.stringify(rawAstroData, null, 2));

  // 6. Send to Gemini for the SoulSync profile analysis
  const finalAnalysis = await generateAstroAnalysis(rawAstroData);

  return {
    rawAstroData,
    finalAnalysis,
  };
}


/**
 * Convex Action Endpoint
 * Receives POST/query requests. For testing, we expose it as a Convex Action.
 */
export const buildProfile = action({
  args: {
    location: v.string(),
    dateOfBirthTimestamp: v.number(),
    birthTime: v.string(),
  },
  handler: async (ctx, args) => {
    return await generateSoulSyncProfile(
      args.location,
      args.dateOfBirthTimestamp,
      args.birthTime
    );
  },
});

/**
 * E2E Test Action for March 27, 2007 (The mocked birthday)
 * Run via: npx convex run astrology_api:testMockProfile
 */
export const testMockProfile = action({
  args: {},
  handler: async (ctx) => {
    // 27/03/2007 UTC timestamp normalize
    console.log("Starting E2E Test for Khai - 27/03/2007...");
    const timestamp = new Date(2007, 2, 27).getTime(); // Note: Month is 0-indexed (2 = March)

    const result = await generateSoulSyncProfile(
      "Ho Chi Minh City, Vietnam",
      timestamp,
      "14:30"
    );

    console.log("SUCCESS! E2E Test completed matching all modules.");
    // Display the structured AI response
    console.log("AI Gateway Result: ", result.finalAnalysis);

    return result.finalAnalysis;
  },
});

/**
 * Endpoint to get the full detailed Western Astrology chart data for a user
 * (used for drawing the visual SVG chart on the frontend).
 */
export const getFullChartData = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Get the user data
    const user = await ctx.runQuery(internal.users.getInternal, { id: args.userId });
    if (!user) throw new Error("User not found");
    if (!user.dateOfBirth) throw new Error("User has no birth date set");

    // 2. Use user's saved location or default to HCMC
    let lat = 10.8231;
    let lng = 106.6297;
    if (user.location?.latitude && user.location?.longitude) {
      lat = user.location.latitude;
      lng = user.location.longitude;
    } else if (user.birthLocation) {
      // If they have a birthLocation string but no lat/lng, we could geocode it, 
      // but to save API calls in production we just do it once. 
      // For now, if we don't have lat/lng, use the processLocationAndTime helper.
      const geo = await processLocationAndTime(user.birthLocation, user.dateOfBirth, user.birthTime || "12:00");
      lat = geo.latitude;
      lng = geo.longitude;
    }

    // 3. Parse local time
    const dateObj = new Date(user.dateOfBirth);
    const [hoursStr, minutesStr] = (user.birthTime || "12:00").split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // 4. Calculate full western data
    const westernData = calculateWesternAstrology(
      dateObj.getFullYear(),
      dateObj.getMonth(),       // 0-indexed
      dateObj.getDate(),
      isNaN(hours) ? 12 : hours,
      isNaN(minutes) ? 0 : minutes,
      lat,
      lng
    );

    return westernData;
  },
});
