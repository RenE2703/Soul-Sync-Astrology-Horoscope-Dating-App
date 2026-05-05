"use node";
// @ts-ignore - circular-natal-horoscope-js has no type declarations
const { Origin, Horoscope } = require("circular-natal-horoscope-js");

// ============================================================
// TYPES
// ============================================================

export interface PlanetPosition {
  name: string;
  degree: number;        // 0-360 ecliptic longitude
  sign: string;          // e.g. "Aries"
  signDegree: number;    // 0-30 within sign
  isRetrograde: boolean;
  house: number;         // 1-12 house placement
}

export interface HouseCusp {
  house: number;   // 1-12
  degree: number;  // 0-360
  sign: string;
  signDegree: number;
}

export interface Aspect {
  body1: string;
  body2: string;
  type: string;   // e.g. "conjunction", "trine", "square"
  orb: number;    // how exact (lower = more exact)
}

export interface CelestialPoint {
  name: string;
  degree: number;
  sign: string;
  signDegree: number;
}

export interface WesternAstrologyData {
  planets: PlanetPosition[];
  celestialPoints: CelestialPoint[];  // Lunar Nodes, Lilith
  houses: {
    ascendant: PlanetPosition;
    midheaven: PlanetPosition;
    placidus: HouseCusp[];     // 12 cusps Placidus
    wholeSign: HouseCusp[];    // 12 cusps Whole Sign
    system: string;            // primary system used
  };
  aspects: Aspect[];
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  modalities: {
    cardinal: number;
    fixed: number;
    mutable: number;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
  "Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
  "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
  "Gemini": "air", "Libra": "air", "Aquarius": "air",
  "Cancer": "water", "Scorpio": "water", "Pisces": "water",
};

const SIGN_MODALITIES: Record<string, "cardinal" | "fixed" | "mutable"> = {
  "Aries": "cardinal", "Cancer": "cardinal", "Libra": "cardinal", "Capricorn": "cardinal",
  "Taurus": "fixed", "Leo": "fixed", "Scorpio": "fixed", "Aquarius": "fixed",
  "Gemini": "mutable", "Virgo": "mutable", "Sagittarius": "mutable", "Pisces": "mutable"
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getZodiacInfo(longitude: number): { sign: string; signDegree: number } {
  const normLon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normLon / 30);
  const signDegree = normLon - (index * 30);
  return {
    sign: ZODIAC_SIGNS[index],
    signDegree: Math.round(signDegree * 100) / 100,
  };
}

/**
 * Extract sign name from a library Sign object.
 * The library returns Sign objects with a .label property (e.g. "Aries").
 */
function extractSignName(signObj: any): string {
  if (!signObj) return "Aries";
  if (typeof signObj === "string") return signObj;
  return signObj.label || signObj.key || signObj.name || "Aries";
}

/**
 * Extract decimal degrees from a ChartPosition object.
 */
function extractDegree(chartPosition: any): number {
  if (!chartPosition) return 0;
  // Try Ecliptic first (standard zodiac position)
  if (chartPosition.Ecliptic?.DecimalDegrees !== undefined) {
    return chartPosition.Ecliptic.DecimalDegrees;
  }
  // Fallback to Horizon
  if (chartPosition.Horizon?.DecimalDegrees !== undefined) {
    return chartPosition.Horizon.DecimalDegrees;
  }
  return 0;
}

/**
 * Extract house cusps from a Horoscope Houses array.
 */
function extractHouseCusps(houses: any[]): HouseCusp[] {
  if (!houses || !Array.isArray(houses)) return [];
  return houses.map((house: any, idx: number) => {
    const degree = extractDegree(house.ChartPosition);
    const signName = extractSignName(house.Sign);
    const { signDegree } = getZodiacInfo(degree);
    return {
      house: idx + 1,
      degree: Math.round(degree * 100) / 100,
      sign: signName,
      signDegree,
    };
  });
}

/**
 * Determine which house (1-12) a given ecliptic degree falls in,
 * given the house cusps.
 */
function findHouseForDegree(degree: number, cusps: HouseCusp[]): number {
  if (!cusps || cusps.length < 12) return 1;
  const normDeg = ((degree % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const cusp = cusps[i].degree;
    const nextCusp = cusps[(i + 1) % 12].degree;
    if (nextCusp > cusp) {
      // Normal case
      if (normDeg >= cusp && normDeg < nextCusp) return i + 1;
    } else {
      // Wraps around 360
      if (normDeg >= cusp || normDeg < nextCusp) return i + 1;
    }
  }
  return 1;
}

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

/**
 * Calculates Western astrology data using CircularNatalHoroscopeJS.
 * This replaces the old astronomy-engine + manual formula approach.
 *
 * The library handles timezone internally using tz-lookup + moment-timezone,
 * so we pass LOCAL time + lat/lng and the library derives UTC automatically.
 *
 * @param localYear - Birth year
 * @param localMonth - Birth month (0-indexed: 0=Jan, 11=Dec)
 * @param localDay - Birth day (1-31)
 * @param localHour - Birth hour in local time (0-23)
 * @param localMinute - Birth minute (0-59)
 * @param latitude - Birth location latitude
 * @param longitude - Birth location longitude
 */
export function calculateWesternAstrology(
  localYear: number,
  localMonth: number,  // 0-indexed (0=Jan, 11=Dec) — matching Origin API
  localDay: number,
  localHour: number,
  localMinute: number,
  latitude: number,
  longitude: number
): WesternAstrologyData {

  // 1. Create Origin (library handles timezone internally)
  const origin = new Origin({
    year: localYear,
    month: localMonth,  // 0 = January, 11 = December
    date: localDay,
    hour: localHour,
    minute: localMinute,
    latitude,
    longitude,
  });

  // 2. Create Placidus Horoscope (for AI analysis)
  const placidusHoroscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points", "angles"],
    aspectWithPoints: ["bodies", "points", "angles"],
    aspectTypes: ["major"],
    customOrbs: {},
    language: "en",
  });

  // 3. Create Whole Sign Horoscope (for visual display)
  const wholeSignHoroscope = new Horoscope({
    origin,
    houseSystem: "whole-sign",
    zodiac: "tropical",
    aspectPoints: [],
    aspectWithPoints: [],
    aspectTypes: [],
    customOrbs: {},
    language: "en",
  });

  // 4. Extract planet positions from Placidus (primary)
  const placidusCusps = extractHouseCusps(placidusHoroscope.Houses);
  const planets: PlanetPosition[] = [];
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 };

  if (placidusHoroscope.CelestialBodies?.all) {
    for (const body of placidusHoroscope.CelestialBodies.all) {
      const degree = extractDegree(body.ChartPosition);
      const signName = extractSignName(body.Sign);
      const { signDegree } = getZodiacInfo(degree);
      const house = findHouseForDegree(degree, placidusCusps);

      planets.push({
        name: body.label || body.key || "Unknown",
        degree: Math.round(degree * 100) / 100,
        sign: signName,
        signDegree,
        isRetrograde: !!body.isRetrograde,
        house,
      });

      // Tally elements and modalities
      if (SIGN_ELEMENTS[signName]) elements[SIGN_ELEMENTS[signName]]++;
      if (SIGN_MODALITIES[signName]) modalities[SIGN_MODALITIES[signName]]++;
    }
  }

  // 5. Extract celestial points (Lunar Nodes, Lilith)
  const celestialPoints: CelestialPoint[] = [];
  if (placidusHoroscope.CelestialPoints?.all) {
    for (const point of placidusHoroscope.CelestialPoints.all) {
      const degree = extractDegree(point.ChartPosition);
      const signName = extractSignName(point.Sign);
      const { signDegree } = getZodiacInfo(degree);
      celestialPoints.push({
        name: point.label || point.key || "Unknown",
        degree: Math.round(degree * 100) / 100,
        sign: signName,
        signDegree,
      });
    }
  }

  // 6. Extract Ascendant and Midheaven
  const ascendantData = placidusHoroscope.Ascendant;
  const midheavenData = placidusHoroscope.Midheaven;

  const ascDegree = extractDegree(ascendantData?.ChartPosition);
  const ascSign = extractSignName(ascendantData?.Sign);
  const mcDegree = extractDegree(midheavenData?.ChartPosition);
  const mcSign = extractSignName(midheavenData?.Sign);

  const ascendant: PlanetPosition = {
    name: "Ascendant",
    degree: Math.round(ascDegree * 100) / 100,
    sign: ascSign,
    signDegree: getZodiacInfo(ascDegree).signDegree,
    isRetrograde: false,
    house: 1,
  };

  const midheaven: PlanetPosition = {
    name: "Midheaven",
    degree: Math.round(mcDegree * 100) / 100,
    sign: mcSign,
    signDegree: getZodiacInfo(mcDegree).signDegree,
    isRetrograde: false,
    house: 10,
  };

  // Add Ascendant to element/modality distribution
  if (SIGN_ELEMENTS[ascSign]) elements[SIGN_ELEMENTS[ascSign]]++;
  if (SIGN_MODALITIES[ascSign]) modalities[SIGN_MODALITIES[ascSign]]++;

  // 7. Extract Whole Sign cusps
  const wholeSignCusps = extractHouseCusps(wholeSignHoroscope.Houses);

  // 8. Extract aspects
  const aspects: Aspect[] = [];
  if (placidusHoroscope.Aspects?.all) {
    for (const aspect of placidusHoroscope.Aspects.all) {
      aspects.push({
        body1: aspect.point1?.label || aspect.point1?.key || "Unknown",
        body2: aspect.point2?.label || aspect.point2?.key || "Unknown",
        type: aspect.label || aspect.key || "unknown",
        orb: typeof aspect.orb === "number" ? Math.round(aspect.orb * 100) / 100 : 0,
      });
    }
  }

  return {
    planets,
    celestialPoints,
    houses: {
      ascendant,
      midheaven,
      placidus: placidusCusps,
      wholeSign: wholeSignCusps,
      system: "placidus",
    },
    aspects,
    elements,
    modalities,
  };
}
