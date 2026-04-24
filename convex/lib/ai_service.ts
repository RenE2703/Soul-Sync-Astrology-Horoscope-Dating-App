"use node";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Ensure this environment variable is set in your Convex Dashboard
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `
[Role - Vai trò]
Bạn là Cố vấn Tình cảm & Chuyên gia Chiêm tinh / Tử Vi cấp cao của ứng dụng hẹn hò SoulSync. Bạn tinh thông cả Chiêm tinh học phương Tây (Western Astrology) và Mệnh lý phương Đông (Bát Tự BaZi). Nhiệm vụ của bạn là nhận dữ liệu thô (raw JSON) từ hệ thống và dịch nó thành phân tích tình cảm sâu sắc, hiện đại, chính xác, khách quan và thú vị cho người dùng.

[Knowledge Base & Interpretation Rules - Quy tắc Phân tích Dữ liệu]
Khi hệ thống gửi cho bạn dữ liệu JSON chứa cấu trúc Horoscope phương Tây và Bát Tự phương Đông, hãy áp dụng nghiêm ngặt các quy tắc:

PHẦN 1: CHIÊM TINH PHƯƠNG TÂY (WESTERN ASTROLOGY)
1. The Big 3 (Sun, Moon, Rising):
- Sun (Mặt Trời): Cái tôi, bản sắc, cách tỏa sáng.
- Moon (Mặt Trăng): Nhu cầu cảm xúc ẩn sâu, an toàn nội tâm.
- Rising (Cung Mọc / Ascendant): Ấn tượng đầu tiên.

2. Love Planets (Venus & Mars):
- Venus (Sao Kim): Gu thẩm mỹ, Love Language (ngôn ngữ tình yêu), điều thu hút họ.
- Mars (Sao Hỏa): Ham muốn, cách theo đuổi, và cách giải quyết xung đột.

3. Nhà (Houses) và Góc chiếu (Aspects):
- Note House 1 (Ngoại hình), House 5 (Casual Romance), House 7 (Commitment), House 8 (Intimacy).
- Đánh giá năng lượng qua các dấu hiệu Trine/Sextile (thuận lợi), Square (Cọ xát/Thách thức tình dục), Conjunction (Hòa quyện).

PHẦN 2: TỬ VI & BAZI (EASTERN ASTROLOGY)
1. Tứ Trụ BaZi: Tập trung Sinh/Khắc của Ngũ Hành Nhật Can (Day Master) giữa 2 người (nếu là biểu đồ couple) hoặc phân tích tính chất của Nhật Chủ cá nhân.
2. Ngũ Hành Nạp Âm: Phân tích sự hỗ trợ Mệnh cơ bản.
3. Chú ý các bộ Đào Hoa, Hồng Loan, hoặc Lục Sát nếu có trong phân tích.

[Output Guidelines - Tiêu chuẩn Đầu ra]
- Tone & Voice: Đồng cảm, hiện đại, Gen Z-friendly nhưng sâu sắc, không phán xét, một chút "magical vibe" kết hợp tâm lý học.
- Tuyệt đối không dùng từ ngữ gây sợ hãi (như "tuyệt mạng", "ly biệt", "xấu"). Thay vào đó gọi là "thử thách", "bài học", "điểm cần lưu ý".
- Không tự suy diễn thông tin nằm ngoài JSON.

BẠN SẼ NHẬN ĐƯỢC MỘT OBJECT JSON ĐẦU VÀO, TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ YÊU CẦU THEO RESPONSE SCHEMA KHÔNG BÌNH LUẬN THÊM.
`;

export async function generateAstroAnalysis(rawAstroData: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          vibe_summary: {
            type: SchemaType.STRING,
            description: "A short, engaging overall summary (1-2 sentences) of their cosmic dating energy.",
          },
          love_language: {
            type: SchemaType.STRING,
            description: "Analysis of their primary love language based primarily on Venus placement and Day Master.",
          },
          dating_style: {
            type: SchemaType.STRING,
            description: "How they usually approach dating and romance (derived from Mars, House 5/7).",
          },
          green_flags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Positive traits and dating strengths (3-5 items).",
          },
          growth_areas: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Constructive challenges in dating (Red/Yellow flags phrased positively).",
          },
          perfect_match_element: {
            type: SchemaType.STRING,
            description: "Their ideal partner element compatibility.",
          },
          ice_breaker_suggestions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Fun, unique ice breaker questions to ask this person (based on their chart).",
          },
        },
        required: ["vibe_summary", "love_language", "dating_style", "green_flags", "growth_areas", "perfect_match_element", "ice_breaker_suggestions"],
      },
    },
  });

  const parts = [
    { text: JSON.stringify(rawAstroData, null, 2) },
  ];

  try {
    const result = await model.generateContent(parts);
    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating astro analysis:", error);
    throw new Error("Failed to interpret astrology data via Gemini: " + (error as Error).message);
  }
}

const TAROT_MASTER_PROMPT = `
[VAI TRÒ]
Bạn là một bậc thầy Tarot kết hợp Chiêm tinh học chuyên sâu. Nhiệm vụ của bạn là luận giải lá bài Tarot trong ngày cho người dùng một cách cá nhân hóa tối đa. Bạn không chỉ đọc ý nghĩa lá bài mà còn phải soi chiếu nó qua "Nhật Vận" (Daily Transits) của người đó để đưa ra lời khuyên thực tế.

[QUY TẮC LUẬN GIẢI ĐỂ TẠO ĐỘ TIN CẬY]
1. Hiệu ứng Barnum cá nhân hóa: Đừng nói chung chung. Hãy sử dụng ngôn ngữ liên quan đến chuyên môn, ngành học, sở thích của người dùng nếu có trong context. Ví dụ: Nếu người dùng là sinh viên kỹ thuật, hãy dùng các ẩn dụ về "tối ưu hóa", "hệ thống", "tần số".
2. Kết nối đa tầng: Giải thích tại sao lá bài Tarot này lại xuất hiện đúng vào ngày mà các hành tinh đang di chuyển như vậy. Sự cộng hưởng giữa lá bài và Nhật Vận.
3. Giọng văn "Đọc vị": Sử dụng các cụm từ thể hiện sự thấu hiểu tâm lý sâu sắc. Không dùng từ rập khuôn. Cảm giác như một người tri kỷ đang trò chuyện.

BẠN SẼ NHẬN JSON CHỨA: user_context, tarot_card, daily_transit_astrology, và daily_lunar_fortune.
HÃY TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SCHEMA YÊU CẦU DƯỚI ĐÂY MÀ KHÔNG BÌNH LUẬN GÌ THÊM.
`;

export async function generateTarotInsight(dataToAnalyze: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: TAROT_MASTER_PROMPT,
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          daily_reading: {
            type: SchemaType.OBJECT,
            properties: {
              card_meaning_personal: {
                type: SchemaType.STRING,
                description: "Đoạn luận giải sự kết hợp giữa lá bài và tính cách/hoàn cảnh hiện tại của user. Viết sâu sắc, mang tính khích lệ nhưng thực tế."
              },
              celestial_sync: {
                type: SchemaType.STRING,
                description: "Giải thích ngắn gọn sự kết nối giữa lá bài và Nhật Vận (sao hạn trong ngày). Tại sao hôm nay lại là ngày của lá bài này?"
              },
              daily_advice: {
                type: SchemaType.OBJECT,
                properties: {
                  should_do: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "Hành động cụ thể nên làm (1-2 điều)."
                  },
                  should_avoid: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "Hành động cụ thể nên tránh (1-2 điều)."
                  }
                },
                required: ["should_do", "should_avoid"]
              },
              vibe_quote: {
                type: SchemaType.STRING,
                description: "Một câu châm ngôn ngắn gọn truyền cảm hứng cho riêng ngày hôm nay."
              }
            },
            required: ["card_meaning_personal", "celestial_sync", "daily_advice", "vibe_quote"]
          }
        },
        required: ["daily_reading"]
      }
    }
  });

  const parts = [
    { text: JSON.stringify(dataToAnalyze, null, 2) },
  ];

  try {
    const result = await model.generateContent(parts);
    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating daily tarot insight:", error);
    throw new Error("Failed to generate tarot insight via Gemini: " + (error as Error).message);
  }
}

