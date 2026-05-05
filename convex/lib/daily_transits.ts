"use node";
// @ts-ignore - circular-natal-horoscope-js has no type declarations
const { Origin, Horoscope } = require("circular-natal-horoscope-js");
// @ts-ignore
import { Lunar } from "lunar-javascript";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getZodiacSign(longitude: number): string {
  const normLon = ((longitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normLon / 30)];
}

function extractSignName(signObj: any): string {
  if (!signObj) return "Aries";
  if (typeof signObj === "string") return signObj;
  return signObj.label || signObj.key || signObj.name || "Aries";
}

function extractDegree(chartPosition: any): number {
  if (!chartPosition) return 0;
  if (chartPosition.Ecliptic?.DecimalDegrees !== undefined) {
    return chartPosition.Ecliptic.DecimalDegrees;
  }
  if (chartPosition.Horizon?.DecimalDegrees !== undefined) {
    return chartPosition.Horizon.DecimalDegrees;
  }
  return 0;
}

export interface DailyTransitsData {
  westernTransits: Array<{ planet: string; sign: string; degree: number; isRetrograde: boolean }>;
  lunarFortune: {
    todayLunarDate: string;
    todayCanChi: string; // e.g. Ngày Giáp Tý
    todayElement: string; // Ngũ hành nạp âm của ngày
  };
}

/**
 * Calculates current real-time transits for both Western Astro and Eastern BaZi.
 * Now uses CircularNatalHoroscopeJS for consistent, accurate transit calculations.
 */
export function calculateTodayTransits(): DailyTransitsData {
  const now = new Date();

  // 1. Western Transits using CircularNatalHoroscopeJS
  // Use HCMC coordinates as default for transit calculations
  const origin = new Origin({
    year: now.getFullYear(),
    month: now.getMonth(),  // 0-indexed
    date: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    latitude: 10.8231,   // HCMC default
    longitude: 106.6297,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "whole-sign",
    zodiac: "tropical",
    aspectPoints: [],
    aspectWithPoints: [],
    aspectTypes: [],
    customOrbs: {},
    language: "en",
  });

  const westernTransits: Array<{ planet: string; sign: string; degree: number; isRetrograde: boolean }> = [];

  if (horoscope.CelestialBodies?.all) {
    for (const body of horoscope.CelestialBodies.all) {
      const degree = extractDegree(body.ChartPosition);
      const sign = extractSignName(body.Sign);
      westernTransits.push({
        planet: body.label || body.key || "Unknown",
        sign,
        degree: Math.round(degree * 10) / 10,
        isRetrograde: !!body.isRetrograde,
      });
    }
  }

  // 2. Eastern Daily Fortune (Can Chi của ngày hôm nay)
  const lunar = Lunar.fromDate(now);
  const lunarFortune = {
    todayLunarDate: `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()}`,
    todayCanChi: `Ngày ${lunar.getDayInGanZhi()} tháng ${lunar.getMonthInGanZhi()} năm ${lunar.getYearInGanZhi()}`,
    todayElement: lunar.getDayNaYin(), // Nạp âm của ngày
  };

  return {
    westernTransits,
    lunarFortune
  };
}
