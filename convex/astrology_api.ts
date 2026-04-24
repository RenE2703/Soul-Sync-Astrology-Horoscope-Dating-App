import { action } from "./_generated/server";
import { v } from "convex/values";
import { processLocationAndTime } from "./lib/geocoding";
import { calculateWesternAstrology } from "./lib/western_astrology";
import { calculateEasternAstrology } from "./lib/eastern_astrology";
import { generateAstroAnalysis } from "./lib/ai_service";

/**
 * Core Integration Engine Function
 * Connects Modules 1, 2, 3 into a Raw Astro Data object,
 * and pushes to Module 4 (AI Gateway) to return structured JSON.
 */
export async function generateSoulSyncProfile(
  location: string,
  dateOfBirthTimestamp: number,
  birthTime: string
) {
  // 1. Timezone & Coordinates Processing
  const geoResult = await processLocationAndTime(location, dateOfBirthTimestamp, birthTime);
  
  // 2. Compute Western Astronomy Data (Math & JS Logic)
  const westernData = calculateWesternAstrology(
    geoResult.utcDate, 
    geoResult.latitude, 
    geoResult.longitude
  );

  // 3. Compute Eastern Astrology Data (Four Pillars & Elements)
  // For Eastern astrology, the Solar/Luani computation requires local time, which we use the `dateOfBirthTimestamp` directly adjusted logic inside lunar-javascript.
  // Actually, standard BaZi usually requires local hour.
  const localDateObj = new Date(geoResult.localDateTimestamp);
  const easternData = calculateEasternAstrology(localDateObj);

  // 4. Combine into complete Raw JSON Object
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

  // 5. Send to Gemini for the SoulSync profile analysis
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
