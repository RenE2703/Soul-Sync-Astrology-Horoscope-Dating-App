import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Doc } from "@/convex/_generated/dataModel";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

// Mapping from English sign names to Vietnamese
const SIGN_VI: Record<string, string> = {
  Aries: "Bạch Dương ♈",   Taurus: "Kim Ngưu ♉",
  Gemini: "Song Tử ♊",     Cancer: "Cự Giải ♋",
  Leo: "Sư Tử ♌",           Virgo: "Xử Nữ ♍",
  Libra: "Thiên Bình ♎",   Scorpio: "Bọ Cạp ♏",
  Sagittarius: "Nhân Mã ♐", Capricorn: "Ma Kết ♑",
  Aquarius: "Bảo Bình ♒",  Pisces: "Song Ngư ♓",
};

// Thiên Can & Địa Chi (for legacy DB rows with Chinese chars)
const HAN_VIET: Record<string, string> = {
  "甲":"Giáp","乙":"Ất","丙":"Bính","丁":"Đinh","戊":"Mậu",
  "己":"Kỷ","庚":"Canh","辛":"Tân","壬":"Nhâm","癸":"Quý",
  "子":"Tý","丑":"Sửu","寅":"Dần","卯":"Mão","辰":"Thìn",
  "巳":"Tỵ","午":"Ngọ","未":"Mùi","申":"Thân","酉":"Dậu",
  "戌":"Tuất","亥":"Hợi",
  "金":"Kim","木":"Mộc","水":"Thủy","火":"Hỏa","土":"Thổ",
  "鼠":"Chuột","牛":"Trâu","虎":"Hổ","兔":"Mèo","龙":"Rồng",
  "蛇":"Rắn","马":"Ngựa","羊":"Dê","猴":"Khỉ","鸡":"Gà",
  "狗":"Chó","猪":"Heo",
};

const NA_YIN_VI: Record<string, string> = {
  "海中金":"Kim Hải Trung","炉中火":"Hỏa Lư Trung","大林木":"Mộc Đại Lâm",
  "路旁土":"Thổ Lộ Bàng","剑锋金":"Kim Kiếm Phong","山头火":"Hỏa Sơn Đầu",
  "涧下水":"Thủy Giản Hạ","城头土":"Thổ Thành Đầu","白蜡金":"Kim Bạch Lạp",
  "杨柳木":"Mộc Dương Liễu","泉中水":"Thủy Tuyền Trung","屋上土":"Thổ Ốc Thượng",
  "霹雳火":"Hỏa Tích Lịch","松柏木":"Mộc Tùng Bách","长流水":"Thủy Trường Lưu",
  "沙中金":"Kim Sa Trung","山下火":"Hỏa Sơn Hạ","平地木":"Mộc Bình Địa",
  "壁上土":"Thổ Bích Thượng","金箔金":"Kim Kim Bạc","覆灯火":"Hỏa Phúc Đăng",
  "天河水":"Thủy Thiên Hà","大驿土":"Thổ Đại Dịch","钗钏金":"Kim Thoa Xuyến",
  "桑柘木":"Mộc Tang Giá","大溪水":"Thủy Đại Khê","沙中土":"Thổ Sa Trung",
  "天上火":"Hỏa Thiên Thượng","石榴木":"Mộc Thạch Lựu","大海水":"Thủy Đại Hải",
};

/** Translate any string containing Chinese characters to Hán-Việt */
function toViet(raw: string): string {
  if (!raw) return raw;
  if (NA_YIN_VI[raw]) return NA_YIN_VI[raw];
  return raw.replace(/[\u4e00-\u9fff]/g, (ch) => HAN_VIET[ch] ?? ch);
}

const ELEMENT_EMOJI: Record<string, string> = {
  fire: "🔥", earth: "🌍", air: "💨", water: "💧",
};

function getSignElement(sign: string): string {
  const fire = ["Aries", "Leo", "Sagittarius"];
  const earth = ["Taurus", "Virgo", "Capricorn"];
  const air = ["Gemini", "Libra", "Aquarius"];
  if (fire.includes(sign)) return "fire";
  if (earth.includes(sign)) return "earth";
  if (air.includes(sign)) return "air";
  return "water";
}

interface AstrologyBadgesProps {
  user: Doc<"users">;
  /** If false, Moon and Rising show as locked */
  isMatched?: boolean;
  /** Compact layout for chat header */
  compact?: boolean;
}

export function AstrologyBadges({ user, isMatched = false, compact = false }: AstrologyBadgesProps) {
  const { colors } = useAppTheme();

  // Data lives under user.astrologyData (from backfill)
  const astro = (user as any).astrologyData;
  const sunSign = astro?.sun as string | undefined;
  const moonSign = astro?.moon as string | undefined;
  const risingSign = astro?.rising as string | undefined;
  // canChi = Chinese zodiac animal + element, e.g. "Mậu Tý (Thổ)"
  const canChi = astro?.canChi as string | undefined;
  const banMenh = astro?.banMenh as string | undefined;

  // Nothing to show
  if (!sunSign && !canChi) return null;

  const sunLabel = sunSign ? (SIGN_VI[sunSign] ?? sunSign) : null;
  const element = sunSign ? ELEMENT_EMOJI[getSignElement(sunSign)] : "";

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Section label */}
      {!compact && (
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
          CUNG HOÀNG ĐẠO
        </Text>
      )}

      <View style={[styles.badgesRow, compact && styles.badgesRowCompact]}>
        {/* Sun Sign — always visible */}
        {sunLabel && (
          <AdaptiveGlassView
            style={[styles.badge, { borderColor: colors.primary + "60" }]}
          >
            <Text style={styles.badgeEmoji}>{element}☀️</Text>
            <View>
              <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>
                {compact ? "Mặt Trời" : "Thái Dương"}
              </Text>
              <Text style={[styles.badgeValue, { color: colors.onBackground }]}>
                {sunLabel}
              </Text>
            </View>
          </AdaptiveGlassView>
        )}

        {/* Moon Sign — locked unless matched */}
        {!compact && (
          <AdaptiveGlassView
            style={[
              styles.badge,
              !isMatched && { opacity: 0.55, borderColor: colors.outline },
            ]}
          >
            {!isMatched ? (
              <>
                <Ionicons name="lock-closed" size={18} color={colors.onSurfaceVariant} />
                <View>
                  <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>
                    Mặt Trăng
                  </Text>
                  <Text style={[styles.badgeValueLocked, { color: colors.onSurfaceVariant }]}>
                    Match để unlock
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.badgeEmoji}>🌙</Text>
                <View>
                  <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>
                    Mặt Trăng
                  </Text>
                  <Text style={[styles.badgeValue, { color: colors.onBackground }]}>
                    {moonSign ? (SIGN_VI[moonSign] ?? moonSign) : "—"}
                  </Text>
                </View>
              </>
            )}
          </AdaptiveGlassView>
        )}

        {/* Rising Sign — locked unless matched */}
        {!compact && (
          <AdaptiveGlassView
            style={[
              styles.badge,
              !isMatched && { opacity: 0.55, borderColor: colors.outline },
            ]}
          >
            {!isMatched ? (
              <>
                <Ionicons name="lock-closed" size={18} color={colors.onSurfaceVariant} />
                <View>
                  <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>
                    Cung Mọc
                  </Text>
                  <Text style={[styles.badgeValueLocked, { color: colors.onSurfaceVariant }]}>
                    Match để unlock
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.badgeEmoji}>⬆️</Text>
                <View>
                  <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>
                    Cung Mọc
                  </Text>
                  <Text style={[styles.badgeValue, { color: colors.onBackground }]}>
                    {risingSign ? (SIGN_VI[risingSign] ?? risingSign) : "—"}
                  </Text>
                </View>
              </>
            )}
          </AdaptiveGlassView>
        )}
      </View>

      {/* Chinese Zodiac */}
      {canChi && (
        <>
          {!compact && (
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
              TỨ TRỤ / BÁT TỰ
            </Text>
          )}
          <AdaptiveGlassView
            style={[
              styles.chineseBadge,
              { borderColor: "#FFD70050" },
              compact && styles.chineseBadgeCompact,
            ]}
          >
            <Text style={styles.badgeEmoji}>🐉</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant }]}>
                {compact ? "Can Chi" : "Địa Chi · Can Chi"}
              </Text>
              <Text style={[styles.badgeValue, { color: colors.onBackground }]}>
                {toViet(canChi)}
              </Text>
              {banMenh && !compact && (
                <Text style={[styles.badgeLabel, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                  Bản Mệnh: {toViet(banMenh)}
                </Text>
              )}
            </View>
          </AdaptiveGlassView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  containerCompact: {
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgesRowCompact: {
    flexWrap: "nowrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    flex: 1,
    minWidth: 140,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  badgeValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  badgeValueLocked: {
    fontSize: 12,
    fontWeight: "500",
    fontStyle: "italic",
  },
  chineseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  chineseBadgeCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
