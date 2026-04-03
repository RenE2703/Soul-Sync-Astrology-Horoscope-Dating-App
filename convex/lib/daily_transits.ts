"use node";
import * as Astronomy from "astronomy-engine";
// @ts-ignore
import { Lunar } from "lunar-javascript";

const TRANSIT_PLANETS = [
  Astronomy.Body.Sun,
  Astronomy.Body.Moon,
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
];

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getZodiacSign(longitude: number): string {
  const normLon = ((longitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normLon / 30)];
}

export interface DailyTransitsData {
  westernTransits: Array<{ planet: string; sign: string; degree: number }>;
  lunarFortune: {
    todayLunarDate: string;
    todayCanChi: string; // e.g. Ngày Giáp Tý
    todayElement: string; // Ngũ hành nạp âm của ngày
  };
}

/**
 * Calculates current real-time transits for both Western Astro and Eastern BaZi.
 */
export function calculateTodayTransits(): DailyTransitsData {
  const now = new Date();
  
  // 1. Western Transits (Geocentric Ecliptic Longitudes)
  const westernTransits = TRANSIT_PLANETS.map(body => {
    const time = new Astronomy.AstroTime(now);
    const vector = Astronomy.GeoVector(body as Astronomy.Body, time, true);
    const ecliptic = Astronomy.Ecliptic(vector);
    const elon = ecliptic.elon;

    return {
      planet: typeof body === 'string' ? body : String(body),
      sign: getZodiacSign(elon),
      degree: Math.round(elon * 10) / 10,
    };
  });

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
