"use node";
// @ts-ignore
import { Lunar } from 'lunar-javascript';

export interface FourPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface EasternAstrologyData {
  lunarDate: string;
  fourPillars: FourPillars;
  dayMaster: string; // Nhật Chủ
  dayMasterElement: string; // Ngũ hành của Nhật Chủ
  yearNaYin: string; // Mệnh Nạp Âm của năm
  zodiacAnimal: string; // Con giáp
}

export function calculateEasternAstrology(date: Date): EasternAstrologyData {
  const lunar = Lunar.fromDate(date);
  
  // Calculate BaZi (Eight Characters / Tứ Trụ)
  const baZi = lunar.getEightChar();
  
  // The Heavenly Stem of the Day is the Day Master (Nhật Chủ / Day Master)
  const dayMaster = baZi.getDayGan();
  const dayMasterElement = baZi.getDayWuXing()[0]; // Extracting just the element string roughly
  
  return {
    lunarDate: `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()}`,
    fourPillars: {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      hour: lunar.getTimeInGanZhi(),
    },
    dayMaster,
    dayMasterElement,
    yearNaYin: lunar.getYearNaYin(),
    zodiacAnimal: lunar.getYearShengXiao(),
  };
}
