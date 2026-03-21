import { generateChatCompletion } from "./openai";

export interface AstrologyData {
  sun: string;
  moon: string;
  rising: string;
  canChi: string;
  banMenh: string;
}

/**
 * Uses Gemini to accurately calculate both Western Astrology and Vietnamese Tu Vi
 * based on the user's date and time of birth.
 */
export async function calculateAstrologyData(
  dateOfBirthTimestamp: number,
  birthTime?: string
): Promise<AstrologyData | undefined> {
  const date = new Date(dateOfBirthTimestamp);
  const dateString = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeString = birthTime || "12:00 PM (Unknown time)";

  const prompt = `
You are an expert master of both Western Astrology and Vietnamese Tu Vi (Tử Vi Đẩu Số Tân Biên, Tử Vi Nghiệm Lý).
A person was born on ${dateString} at ${timeString}.

Calculate their Western Astrology signs (Sun, Moon, Rising) and their Eastern Tu Vi details (Can Chi of the birth year, and Bản Mệnh/Ngũ Hành Nạp Âm).
Return ONLY a valid JSON object matching exactly this format:
{
  "sun": "the sun sign (e.g. Leo)",
  "moon": "the moon sign (e.g. Scorpio)",
  "rising": "the rising sign (e.g. Gemini)",
  "canChi": "the lunar year (e.g. Nhâm Thân)",
  "banMenh": "the element (e.g. Kiếm Phong Kim)"
}
Do not write any other explanation or markdown blocks. Just output the JSON.
  `;

  try {
    const rawResponse = await generateChatCompletion(prompt, { maxTokens: 300, temperature: 0.1 });
    // Remove potential markdown code blocks like ```json ... ```
    const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Attempt to extract JSON if there's trailing junk
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    const finalJson = jsonMatch ? jsonMatch[0] : cleanJson;
    
    const data: AstrologyData = JSON.parse(finalJson);
    return data;
  } catch (error) {
    console.error("Failed to calculate astrology data via Gemini, using fallbacks", error);
    // Fallback based on simple date calculation
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let sign = "Ma Kết";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sign = "Bảo Bình";
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) sign = "Song Ngư";
    else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sign = "Bạch Dương";
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sign = "Kim Ngưu";
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sign = "Song Tử";
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sign = "Cự Giải";
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sign = "Sư Tử";
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sign = "Xử Nữ";
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sign = "Thiên Bình";
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sign = "Bọ Cạp";
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sign = "Nhân Mã";

    return {
      sun: sign,
      moon: "Ẩn số",
      rising: "Ẩn số",
      canChi: "Ẩn số",
      banMenh: "Ẩn số",
    };
  }
}
