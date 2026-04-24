import { processLocationAndTime } from "./geocoding";
import { calculateWesternAstrology } from "./western_astrology";
import { calculateEasternAstrology } from "./eastern_astrology";

export interface AstrologyData {
  sun: string;
  moon: string;
  rising: string;
  canChi: string;
  banMenh: string;
}

/**
 * Main function: Calculate astrology data using local Calculation Engine.
 *
 * IMPORTANT DATA SYNC:
 * This function ALWAYS computes BOTH Western astrology AND Vietnamese Tử Vi
 * from the same birth date/time, using 100% local, high-precision astronomical
 * JS algorithms. NO LLMs, NO EXTERNAL APIS needed.
 */
export async function calculateAstrologyData(
  dateOfBirthTimestamp: number,
  birthTime?: string
): Promise<AstrologyData> {
  // Use a default string for the generalized profile creation process, 
  // users can expand on exactly where they were born later if need be.
  const geoResult = await processLocationAndTime(
    "Ho Chi Minh City", 
    dateOfBirthTimestamp, 
    birthTime || "12:00"
  );

  const western = calculateWesternAstrology(
    geoResult.utcDate, 
    geoResult.latitude, 
    geoResult.longitude
  );
  
  const localDateObj = new Date(geoResult.localDateTimestamp);
  const eastern = calculateEasternAstrology(localDateObj);

  return {
    sun: western.planets.find(p => p.name === "Sun")?.sign || "Aries",
    moon: western.planets.find(p => p.name === "Moon")?.sign || "Aries",
    rising: western.houses.ascendant.sign || "Aries",
    canChi: eastern.fourPillars.year,
    banMenh: eastern.yearNaYin
  };
}
