"use node";
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
 *
 * Uses CircularNatalHoroscopeJS for Western astrology (Moshier ephemeris)
 * and lunar-javascript for Eastern BaZi / Tử Vi.
 */
export async function calculateAstrologyData(
  dateOfBirthTimestamp: number,
  birthTime?: string,
  birthLocation?: string,
  latitude?: number,
  longitude?: number
): Promise<AstrologyData> {
  // Parse local date/time components for CircularNatalHoroscopeJS
  const dateObj = new Date(dateOfBirthTimestamp);
  const [hoursStr, minutesStr] = (birthTime || "12:00").split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  let lat = latitude;
  let lng = longitude;
  let localDateTimestamp = dateOfBirthTimestamp; // Fallback

  // If we don't have exact coordinates, try to resolve them using geocoding
  if (lat === undefined || lng === undefined) {
    const geoResult = await processLocationAndTime(
      birthLocation || "Ho Chi Minh City",
      dateOfBirthTimestamp,
      birthTime || "12:00"
    );
    lat = geoResult.latitude;
    lng = geoResult.longitude;
    localDateTimestamp = geoResult.localDateTimestamp;
  } else {
    // If coordinates are provided, we approximate localDateTimestamp
    // CircularNatalHoroscopeJS handles the timezone offset internally based on lat/lng anyway
    localDateTimestamp = dateOfBirthTimestamp + (hours * 3600000) + (minutes * 60000);
  }

  const western = calculateWesternAstrology(
    dateObj.getFullYear(),
    dateObj.getMonth(),       // 0-indexed (Jan=0)
    dateObj.getDate(),
    isNaN(hours) ? 12 : hours,
    isNaN(minutes) ? 0 : minutes,
    lat || 10.8231,
    lng || 106.6297
  );

  // Eastern astrology uses local date
  const localDateObj = new Date(geoResult.localDateTimestamp);
  const eastern = calculateEasternAstrology(localDateObj);

  // Extract Sun/Moon/Rising from the new data structure
  const sunSign = western.planets.find(p =>
    p.name.toLowerCase() === "sun"
  )?.sign || "Aries";

  const moonSign = western.planets.find(p =>
    p.name.toLowerCase() === "moon"
  )?.sign || "Aries";

  const risingSign = western.houses.ascendant.sign || "Aries";

  return {
    sun: sunSign,
    moon: moonSign,
    rising: risingSign,
    canChi: eastern.fourPillars.year,
    banMenh: eastern.yearNaYin,
  };
}
