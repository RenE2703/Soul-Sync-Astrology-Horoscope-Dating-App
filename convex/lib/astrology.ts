import { generateChatCompletion } from "./openai";

export interface AstrologyData {
  sun: string;
  moon: string;
  rising: string;
  canChi: string;
  banMenh: string;
}

// Zodiac sign lookup from ecliptic longitude
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function getZodiacSign(longitude: number): string {
  const index = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[index];
}

// Simple sun sign fallback from date (no API needed)
function getSunSignFromDate(month: number, day: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

// Get timezone offset in hours for Ho Chi Minh City as default
function getDefaultTimezone(): number {
  return 7; // UTC+7
}

/**
 * Parse birth time string like "14:30" into hours and minutes
 */
function parseBirthTime(birthTime?: string): { hours: number; minutes: number } {
  if (!birthTime) return { hours: 12, minutes: 0 }; // Default noon
  const parts = birthTime.split(":");
  return {
    hours: parseInt(parts[0], 10) || 12,
    minutes: parseInt(parts[1], 10) || 0,
  };
}

// ====================================================
// FREE ASTROLOGY API - Western Astrology (reduces Gemini load)
// API: https://json.freeastrologyapi.com/western/planets
// API: https://json.freeastrologyapi.com/western/houses
// ====================================================

const FREE_ASTROLOGY_API_KEY = "ClHTf1fVXMaoTCj9jRpzd4uW8KalT9x0aQFneMXK";

interface FreeAstrologyRequestBody {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
  latitude: number;
  longitude: number;
  timezone: number;
  settings?: {
    observation_point?: string;
    ayanamsha?: string;
  };
}

/**
 * Fetch Western astrology planetary positions from Free Astrology API.
 * Returns sun sign and moon sign.
 */
async function fetchWesternPlanets(body: FreeAstrologyRequestBody): Promise<{ sun: string; moon: string } | null> {
  try {
    const response = await fetch("https://json.freeastrologyapi.com/western/planets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": FREE_ASTROLOGY_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Free Astrology API /planets error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    // The API returns an object keyed by planet name (e.g. "Sun", "Moon")
    // Each planet has "fullDegree" (ecliptic longitude) and "normDegree", "isRetro", "Sign"
    const sunData = data.output?.[0] ?? data.output?.Sun ?? data["Sun"];
    const moonData = data.output?.[1] ?? data.output?.Moon ?? data["Moon"];

    let sun = "Aries";
    let moon = "Aries";

    // Try direct Sign property first, fallback to degree calculation
    if (sunData?.Sign) {
      sun = sunData.Sign;
    } else if (sunData?.fullDegree !== undefined) {
      sun = getZodiacSign(sunData.fullDegree);
    } else if (sunData?.current_sign !== undefined) {
      sun = String(sunData.current_sign);
    }

    if (moonData?.Sign) {
      moon = moonData.Sign;
    } else if (moonData?.fullDegree !== undefined) {
      moon = getZodiacSign(moonData.fullDegree);
    } else if (moonData?.current_sign !== undefined) {
      moon = String(moonData.current_sign);
    }

    return { sun, moon };
  } catch (error) {
    console.error("Free Astrology API /planets fetch failed:", error);
    return null;
  }
}

/**
 * Fetch Western astrology house cusps from Free Astrology API.
 * Returns the rising sign (ascendant = house 1).
 */
async function fetchWesternHouses(body: FreeAstrologyRequestBody): Promise<string | null> {
  try {
    const response = await fetch("https://json.freeastrologyapi.com/western/houses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": FREE_ASTROLOGY_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Free Astrology API /houses error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    // House 1 cusp = Ascendant. The API returns houses as an array or object.
    const house1 = data.output?.[0] ?? data.output?.House1 ?? data["House 1"];

    if (house1?.Sign) {
      return house1.Sign;
    } else if (house1?.degree !== undefined) {
      return getZodiacSign(house1.degree);
    } else if (house1?.fullDegree !== undefined) {
      return getZodiacSign(house1.fullDegree);
    }

    return null;
  } catch (error) {
    console.error("Free Astrology API /houses fetch failed:", error);
    return null;
  }
}

/**
 * Uses Gemini to calculate Vietnamese Tu Vi (Can Chi, Ban Menh)
 * Only used when the Free Astrology API cannot provide this data.
 */
async function calculateTuViData(
  dateString: string,
  timeString: string
): Promise<{ canChi: string; banMenh: string }> {
  try {
    const prompt = `You are an expert in Vietnamese Tử Vi (Tử Vi Đẩu Số).
A person was born on ${dateString} at ${timeString}.
Calculate their Can Chi of the birth year (e.g. "Nhâm Thân") and Bản Mệnh/Ngũ Hành Nạp Âm (e.g. "Kiếm Phong Kim").
Return ONLY a valid JSON object:
{"canChi": "...", "banMenh": "..."}
No explanation, no markdown.`;

    const rawResponse = await generateChatCompletion(prompt, { maxTokens: 100, temperature: 0.1 });
    const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);
    return { canChi: parsed.canChi || "Ẩn số", banMenh: parsed.banMenh || "Ẩn số" };
  } catch (error) {
    console.error("Tu Vi calculation via Gemini failed:", error);
    return { canChi: "Ẩn số", banMenh: "Ẩn số" };
  }
}

/**
 * Main function: Calculate astrology data using Free Astrology API (Western)
 * + Gemini (Vietnamese Tu Vi only).
 *
 * IMPORTANT DATA SYNC:
 * This function ALWAYS computes BOTH Western astrology AND Vietnamese Tử Vi
 * from the same birth date/time, regardless of the user's preferred system.
 * This ensures every profile has complete cosmic data for:
 * - Western: Sun, Moon, Rising signs
 * - Vietnamese: Cần Chi (year), Bản Mệnh (Ngũ Hành Nạp Âm)
 *
 * This reduces Gemini API usage significantly by offloading deterministic
 * Western astrology calculations to the free third-party API.
 */
export async function calculateAstrologyData(
  dateOfBirthTimestamp: number,
  birthTime?: string
): Promise<AstrologyData> {
  const date = new Date(dateOfBirthTimestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const { hours, minutes } = parseBirthTime(birthTime);
  const dateString = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeString = birthTime || "12:00 (Unknown)";

  // Default location: Ho Chi Minh City (for timezone and coordinates)
  const requestBody: FreeAstrologyRequestBody = {
    year,
    month,
    date: day,
    hours,
    minutes,
    seconds: 0,
    latitude: 10.8231,   // Ho Chi Minh City
    longitude: 106.6297,
    timezone: getDefaultTimezone(),
    settings: {
      observation_point: "geocentric",
    },
  };

  // ---- SYSTEM 1: Western Astrology via Free Astrology API ----
  let sun = getSunSignFromDate(month, day); // Fallback always available
  let moon = sun; // Default to sun sign if API fails
  let rising = sun;

  try {
    // Fetch planets (Sun + Moon) and houses (Rising/Ascendant) in parallel
    const [planetsResult, housesResult] = await Promise.all([
      fetchWesternPlanets(requestBody),
      fetchWesternHouses(requestBody),
    ]);

    if (planetsResult) {
      sun = planetsResult.sun;
      moon = planetsResult.moon;
    }

    if (housesResult) {
      rising = housesResult;
    }
  } catch (error) {
    console.error("Free Astrology API calls failed, using date-based fallback:", error);
  }

  // ---- SYSTEM 2: Vietnamese Tử Vi via Gemini ----
  const tuVi = await calculateTuViData(dateString, timeString);

  // ALWAYS return complete data for both systems
  return {
    sun,
    moon,
    rising,
    canChi: tuVi.canChi,
    banMenh: tuVi.banMenh,
  };
}

