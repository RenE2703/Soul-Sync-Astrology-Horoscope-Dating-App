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

// ── Thiên Can (Heavenly Stems) ──────────────────────────────
const CAN_VI: Record<string, string> = {
  "甲": "Giáp", "乙": "Ất",  "丙": "Bính", "丁": "Đinh",
  "戊": "Mậu",  "己": "Kỷ",  "庚": "Canh", "辛": "Tân",
  "壬": "Nhâm", "癸": "Quý",
};

// ── Địa Chi (Earthly Branches) ──────────────────────────────
const CHI_VI: Record<string, string> = {
  "子": "Tý",   "丑": "Sửu", "寅": "Dần", "卯": "Mão",
  "辰": "Thìn", "巳": "Tỵ",  "午": "Ngọ", "未": "Mùi",
  "申": "Thân", "酉": "Dậu", "戌": "Tuất","亥": "Hợi",
};

// ── Lục Thập Hoa Giáp (60 combinations) ────────────────────
function translateGanZhi(ganZhi: string): string {
  if (!ganZhi || ganZhi.length < 2) return ganZhi;
  const can = CAN_VI[ganZhi[0]] ?? ganZhi[0];
  const chi = CHI_VI[ganZhi[1]] ?? ganZhi[1];
  return `${can} ${chi}`;
}

// ── Nạp Âm (60-year cycle elements) ───────────────────────
const NA_YIN_VI: Record<string, string> = {
  "海中金": "Kim Hải Trung (Vàng dưới đáy biển)",
  "炉中火": "Hỏa Lư Trung (Lửa trong lò)",
  "大林木": "Mộc Đại Lâm (Rừng cây to)",
  "路旁土": "Thổ Lộ Bàng (Đất ven đường)",
  "剑锋金": "Kim Kiếm Phong (Vàng mũi kiếm)",
  "山头火": "Hỏa Sơn Đầu (Lửa đỉnh núi)",
  "涧下水": "Thủy Giản Hạ (Nước dưới suối)",
  "城头土": "Thổ Thành Đầu (Đất đầu thành)",
  "白蜡金": "Kim Bạch Lạp (Vàng bạch lạp)",
  "杨柳木": "Mộc Dương Liễu (Cây liễu)",
  "泉中水": "Thủy Tuyền Trung (Nước trong suối)",
  "屋上土": "Thổ Ốc Thượng (Đất mái nhà)",
  "霹雳火": "Hỏa Tích Lịch (Lửa sấm sét)",
  "松柏木": "Mộc Tùng Bách (Cây tùng bách)",
  "长流水": "Thủy Trường Lưu (Nước chảy dài)",
  "沙中金": "Kim Sa Trung (Vàng trong cát)",
  "山下火": "Hỏa Sơn Hạ (Lửa chân núi)",
  "平地木": "Mộc Bình Địa (Cây đất bằng)",
  "壁上土": "Thổ Bích Thượng (Đất vách tường)",
  "金箔金": "Kim Kim Bạc (Vàng lá mỏng)",
  "覆灯火": "Hỏa Phúc Đăng (Lửa đèn úp)",
  "天河水": "Thủy Thiên Hà (Nước sông Ngân)",
  "大驿土": "Thổ Đại Dịch (Đất trạm lớn)",
  "钗钏金": "Kim Thoa Xuyến (Vàng châm thoa)",
  "桑柘木": "Mộc Tang Giá (Cây dâu tằm)",
  "大溪水": "Thủy Đại Khê (Nước suối lớn)",
  "沙中土": "Thổ Sa Trung (Đất trong cát)",
  "天上火": "Hỏa Thiên Thượng (Lửa trên trời)",
  "石榴木": "Mộc Thạch Lựu (Cây lựu)",
  "大海水": "Thủy Đại Hải (Nước đại dương)",
};

// ── Con giáp (12 animals) ──────────────────────────────────
const SHENG_XIAO_VI: Record<string, string> = {
  "鼠": "Chuột 🐭", "牛": "Trâu 🐂",  "虎": "Hổ 🐯",  "兔": "Mèo 🐱",
  "龙": "Rồng 🐲",  "蛇": "Rắn 🐍",  "马": "Ngựa 🐴", "羊": "Dê 🐑",
  "猴": "Khỉ 🐒",  "鸡": "Gà 🐓",   "狗": "Chó 🐕",  "猪": "Heo 🐷",
};

// ── Ngũ Hành (Five Elements) ───────────────────────────────
const WU_XING_VI: Record<string, string> = {
  "金": "Kim", "木": "Mộc", "水": "Thủy", "火": "Hỏa", "土": "Thổ",
};

function translateWuXing(str: string): string {
  return str.replace(/[金木水火土]/g, (ch) => WU_XING_VI[ch] ?? ch);
}

export function calculateEasternAstrology(date: Date): EasternAstrologyData {
  const lunar = Lunar.fromDate(date);
  const baZi = lunar.getEightChar();

  const rawDayMaster = baZi.getDayGan() as string;
  const rawDayElement = baZi.getDayWuXing() as string;
  const rawNaYin = lunar.getYearNaYin() as string;
  const rawAnimal = lunar.getYearShengXiao() as string;

  return {
    lunarDate: `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()} (Âm lịch)`,
    fourPillars: {
      year:  translateGanZhi(lunar.getYearInGanZhi()),
      month: translateGanZhi(lunar.getMonthInGanZhi()),
      day:   translateGanZhi(lunar.getDayInGanZhi()),
      hour:  translateGanZhi(lunar.getTimeInGanZhi()),
    },
    dayMaster:        CAN_VI[rawDayMaster] ?? rawDayMaster,
    dayMasterElement: translateWuXing(rawDayElement ?? ""),
    yearNaYin:        NA_YIN_VI[rawNaYin] ?? translateWuXing(rawNaYin),
    zodiacAnimal:     SHENG_XIAO_VI[rawAnimal] ?? rawAnimal,
  };
}
