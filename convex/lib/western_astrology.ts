"use node";
import * as Astronomy from "astronomy-engine";

export interface PlanetPosition {
  name: string;
  degree: number; // 0 to 360
  sign: string;
  signDegree: number; // 0 to 30
}

export interface WesternAstrologyData {
  planets: PlanetPosition[];
  houses: {
    ascendant: PlanetPosition;
    midheaven: PlanetPosition;
  };
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

const PLANET_KEYS = [
  Astronomy.Body.Sun,
  Astronomy.Body.Moon,
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
  Astronomy.Body.Uranus,
  Astronomy.Body.Neptune,
  Astronomy.Body.Pluto,
];

function getZodiacInfo(longitude: number): { sign: string; signDegree: number } {
  // Normalize just in case
  const normLon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normLon / 30);
  const signDegree = normLon - (index * 30);
  return {
    sign: ZODIAC_SIGNS[index],
    signDegree,
  };
}

/**
 * Calculates GMST (Greenwich Mean Sidereal Time) in degrees
 */
function getGMST(date: Date): number {
  const jd = new Astronomy.AstroTime(date).ut;
  // Formula for GMST (Greenwich Mean Sidereal Time)
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000.0;
  return ((gmst % 360) + 360) % 360;
}

/**
 * Calculates Ascendant (AC) and Midheaven (MC)
 */
function calculateAngles(date: Date, latitude: number, longitude: number): { ascendant: number; midheaven: number } {
  const gmst = getGMST(date);
  const lst = ((gmst + longitude) % 360 + 360) % 360; // Local Sidereal Time in degrees
  
  // Obliquity of the Ecliptic (approximate, good enough for dating app purposes ~23.439)
  const obl = 23.4392911 * (Math.PI / 180);
  const lstRad = lst * (Math.PI / 180);
  const latRad = latitude * (Math.PI / 180);

  // Midheaven (MC)
  const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(obl));
  let mc = mcRad * (180 / Math.PI);
  mc = ((mc % 360) + 360) % 360;

  // Ascendant (AC)
  const num = Math.cos(lstRad);
  const den = -(Math.sin(lstRad) * Math.cos(obl) + Math.tan(latRad) * Math.sin(obl));
  const ascRad = Math.atan2(num, den);
  let asc = ascRad * (180 / Math.PI);
  asc = ((asc % 360) + 360) % 360;

  return { ascendant: asc, midheaven: mc };
}

export function calculateWesternAstrology(utcDate: Date, latitude: number, longitude: number): WesternAstrologyData {
  const planets: PlanetPosition[] = [];

  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 };

  // 1. Calculate Planets
  for (const body of PLANET_KEYS) {
    const time = new Astronomy.AstroTime(utcDate);
    // Get Geocentric coordinates (as seen from Earth)
    const vector = Astronomy.GeoVector(body as Astronomy.Body, time, true);
    const eclipticCoords = Astronomy.Ecliptic(vector);
    const eclipticLon = eclipticCoords.elon;
    
    // In astronomy-engine, eclipticCoords.elon is the ecliptic longitude in degrees
    const { sign, signDegree } = getZodiacInfo(eclipticLon);
    
    planets.push({
      name: typeof body === 'string' ? body : String(body),
      degree: eclipticLon,
      sign,
      signDegree,
    });

    const el = SIGN_ELEMENTS[sign];
    const mod = SIGN_MODALITIES[sign];
    elements[el]++;
    modalities[mod]++;
  }

  // 2. Calculate Angles
  const { ascendant, midheaven } = calculateAngles(utcDate, latitude, longitude);
  const acInfo = getZodiacInfo(ascendant);
  const mcInfo = getZodiacInfo(midheaven);

  // Add AC properties to distribution
  elements[SIGN_ELEMENTS[acInfo.sign]]++;
  modalities[SIGN_MODALITIES[acInfo.sign]]++;

  return {
    planets,
    houses: {
      ascendant: {
        name: "Ascendant",
        degree: ascendant,
        sign: acInfo.sign,
        signDegree: acInfo.signDegree,
      },
      midheaven: {
        name: "Midheaven",
        degree: midheaven,
        sign: mcInfo.sign,
        signDegree: mcInfo.signDegree,
      }
    },
    elements,
    modalities
  };
}
