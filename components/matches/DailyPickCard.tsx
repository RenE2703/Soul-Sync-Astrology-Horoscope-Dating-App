import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoIndicators, PhotoTapZones } from "@/components/ui";
import { Doc } from "@/convex/_generated/dataModel";
import { SCREEN_HEIGHT } from "@/lib/constants";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

// ============================================
// ZODIAC HELPERS
// ============================================

const ZODIAC_EMOJI: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ZODIAC_ELEMENTS: Record<string, { element: string; emoji: string }> = {
  Aries: { element: "Fire", emoji: "🔥" },
  Taurus: { element: "Earth", emoji: "🌍" },
  Gemini: { element: "Air", emoji: "💨" },
  Cancer: { element: "Water", emoji: "💧" },
  Leo: { element: "Fire", emoji: "🔥" },
  Virgo: { element: "Earth", emoji: "🌍" },
  Libra: { element: "Air", emoji: "💨" },
  Scorpio: { element: "Water", emoji: "💧" },
  Sagittarius: { element: "Fire", emoji: "🔥" },
  Capricorn: { element: "Earth", emoji: "🌍" },
  Aquarius: { element: "Air", emoji: "💨" },
  Pisces: { element: "Water", emoji: "💧" },
};

// Element compatibility scores & descriptions
const ELEMENT_COMPAT: Record<string, Record<string, { score: number; desc: string }>> = {
  Fire: {
    Fire:  { score: 0.7, desc: "Double passion! Your fiery energies create intense chemistry and exciting adventure 🔥🔥" },
    Air:   { score: 0.9, desc: "Perfect harmony! Air fans your Fire — stimulating conversations and endless inspiration ✨" },
    Earth: { score: 0.4, desc: "Opposites attract! Earth grounds your Fire, creating stability balanced with passion 🌋" },
    Water: { score: 0.3, desc: "Steamy connection! Your combined energies create powerful transformation together 💫" },
  },
  Air: {
    Fire:  { score: 0.9, desc: "Perfect harmony! Your Air fans their Fire — together you're unstoppable ✨" },
    Air:   { score: 0.7, desc: "Intellectual soulmates! Deep conversations and shared curiosity connect you 💫" },
    Earth: { score: 0.5, desc: "Balance of mind and matter — you bring ideas, they bring stability 🤝" },
    Water: { score: 0.4, desc: "Emotional depth meets intellectual spark — a mysterious, intriguing match 🌙" },
  },
  Earth: {
    Fire:  { score: 0.4, desc: "Opposites attract! Your stability grounds their passion — a powerful duo 🌋" },
    Air:   { score: 0.5, desc: "Mind meets matter — their ideas inspire, your stability builds 🤝" },
    Earth: { score: 0.7, desc: "Rock-solid connection! Shared values of security, loyalty and comfort 🏔️" },
    Water: { score: 0.9, desc: "Natural harmony! Earth and Water nourish each other — deeply nurturing love 🌿" },
  },
  Water: {
    Fire:  { score: 0.3, desc: "Steamy connection! Deep emotions meet fiery passion — transformative love 💫" },
    Air:   { score: 0.4, desc: "Emotional depth meets curiosity — a mysterious, intriguing bond 🌙" },
    Earth: { score: 0.9, desc: "Natural harmony! Your emotions are grounded by their stability 🌿" },
    Water: { score: 0.7, desc: "Ocean of feelings! You understand each other's emotional depths intuitively 🌊" },
  },
};

// Vietnamese Ngũ Hành element mapping from Bản Mệnh
const NGU_HANH_MAP: Record<string, string> = {
  Kim: "Metal", Mộc: "Wood", Thủy: "Water",
  Hỏa: "Fire", Thổ: "Earth",
};

// Ngũ Hành compatibility (Tương Sinh cycle)
const NGU_HANH_COMPAT: Record<string, Record<string, { relation: string; desc: string }>> = {
  Metal: {
    Metal: { relation: "Tỷ Hòa", desc: "Cùng hành Kim — bổ trợ nhau, tính cách tương đồng ⚔️" },
    Water: { relation: "Tương Sinh", desc: "Kim sinh Thủy — bạn nuôi dưỡng đối phương, mối quan hệ thuận lợi 💧" },
    Wood:  { relation: "Tương Khắc", desc: "Kim khắc Mộc — thử thách nhưng tạo nên sức mạnh cân bằng 🌳" },
    Fire:  { relation: "Bị Khắc", desc: "Hỏa khắc Kim — cần sự kiên nhẫn và hiểu biết lẫn nhau 🔥" },
    Earth: { relation: "Được Sinh", desc: "Thổ sinh Kim — đối phương là nền tảng vững chắc cho bạn 🏔️" },
  },
  Water: {
    Metal: { relation: "Được Sinh", desc: "Kim sinh Thủy — đối phương nuôi dưỡng và hỗ trợ bạn 💧" },
    Water: { relation: "Tỷ Hòa", desc: "Cùng hành Thủy — sự đồng cảm sâu sắc và hiểu nhau 🌊" },
    Wood:  { relation: "Tương Sinh", desc: "Thủy sinh Mộc — bạn tưới tắm sự phát triển của đối phương 🌱" },
    Fire:  { relation: "Tương Khắc", desc: "Thủy khắc Hỏa — năng lượng mạnh mẽ nhưng cần cân bằng 💫" },
    Earth: { relation: "Bị Khắc", desc: "Thổ khắc Thủy — thử thách lớn nhưng có thể vượt qua 🌍" },
  },
  Wood: {
    Metal: { relation: "Bị Khắc", desc: "Kim khắc Mộc — gian nan nhưng rèn luyện sức mạnh bền bỉ ⚔️" },
    Water: { relation: "Được Sinh", desc: "Thủy sinh Mộc — đối phương là nguồn sức sống của bạn 🌱" },
    Wood:  { relation: "Tỷ Hòa", desc: "Cùng hành Mộc — cùng nhau phát triển và nở rộ 🌳" },
    Fire:  { relation: "Tương Sinh", desc: "Mộc sinh Hỏa — bạn thổi bùng ngọn lửa đam mê của đối phương 🔥" },
    Earth: { relation: "Tương Khắc", desc: "Mộc khắc Thổ — năng động kết hợp ổn định tạo nên sự cân bằng 🏡" },
  },
  Fire: {
    Metal: { relation: "Tương Khắc", desc: "Hỏa khắc Kim — mạnh mẽ, nóng bỏng nhưng cần kiên nhẫn ⚔️" },
    Water: { relation: "Bị Khắc", desc: "Thủy khắc Hỏa — thử thách nhưng tạo sức mạnh cân bằng 💧" },
    Wood:  { relation: "Được Sinh", desc: "Mộc sinh Hỏa — đối phương tiếp thêm năng lượng và đam mê cho bạn 🌳" },
    Fire:  { relation: "Tỷ Hòa", desc: "Cùng hành Hỏa — đam mê mãnh liệt và năng lượng bùng nổ 🔥🔥" },
    Earth: { relation: "Tương Sinh", desc: "Hỏa sinh Thổ — bạn là nguồn cảm hứng và nền tảng cho đối phương 🌍" },
  },
  Earth: {
    Metal: { relation: "Tương Sinh", desc: "Thổ sinh Kim — bạn là nền tảng nuôi dưỡng sức mạnh của đối phương ⚔️" },
    Water: { relation: "Tương Khắc", desc: "Thổ khắc Thủy — kiểm soát nhưng cần sự mềm mỏng 🌊" },
    Wood:  { relation: "Bị Khắc", desc: "Mộc khắc Thổ — thách thức giúp cả hai trưởng thành 🌱" },
    Fire:  { relation: "Được Sinh", desc: "Hỏa sinh Thổ — đối phương mang đến sự ấm áp và cảm hứng 🔥" },
    Earth: { relation: "Tỷ Hòa", desc: "Cùng hành Thổ — vững chắc, hài hòa và gắn bó lâu dài 🏔️" },
  },
};

/**
 * Extract Ngũ Hành element from Bản Mệnh string (e.g. "Kiếm Phong Kim" → "Metal")
 */
function extractNguHanh(banMenh?: string): string | null {
  if (!banMenh || banMenh === "Ẩn số") return null;
  for (const [vn, en] of Object.entries(NGU_HANH_MAP)) {
    if (banMenh.includes(vn)) return en;
  }
  return null;
}

/**
 * Build compatibility reasons between two users
 * Returns array of reason objects with emoji + text
 */
function buildCompatReasons(
  myAstro: Doc<"users">["astrologyData"],
  theirAstro: Doc<"users">["astrologyData"],
  theirName: string,
): { icon: string; title: string; desc: string }[] {
  const reasons: { icon: string; title: string; desc: string }[] = [];

  if (!theirAstro) return reasons;

  // === WESTERN: Sun sign element compatibility ===
  if (myAstro?.sun && theirAstro.sun) {
    const el1 = ZODIAC_ELEMENTS[myAstro.sun]?.element;
    const el2 = ZODIAC_ELEMENTS[theirAstro.sun]?.element;
    if (el1 && el2) {
      const compat = ELEMENT_COMPAT[el1]?.[el2];
      if (compat) {
        reasons.push({
          icon: "☀️",
          title: `Sun Sign: ${myAstro.sun} ${ZODIAC_ELEMENTS[myAstro.sun]?.emoji || ""} × ${theirAstro.sun} ${ZODIAC_ELEMENTS[theirAstro.sun]?.emoji || ""}`,
          desc: compat.desc,
        });
      }
    }
  }

  // === WESTERN: Moon sign emotional compatibility ===
  if (myAstro?.moon && theirAstro.moon && myAstro.moon !== "Unknown" && theirAstro.moon !== "Unknown") {
    const el1 = ZODIAC_ELEMENTS[myAstro.moon]?.element;
    const el2 = ZODIAC_ELEMENTS[theirAstro.moon]?.element;
    if (el1 && el2) {
      if (el1 === el2) {
        reasons.push({
          icon: "🌙",
          title: `Moon: ${myAstro.moon} × ${theirAstro.moon}`,
          desc: "Your Moons share the same element — you feel emotionally safe and understood together 💗",
        });
      } else if ((el1 === "Fire" && el2 === "Air") || (el1 === "Air" && el2 === "Fire") ||
                 (el1 === "Earth" && el2 === "Water") || (el1 === "Water" && el2 === "Earth")) {
        reasons.push({
          icon: "🌙",
          title: `Moon: ${myAstro.moon} × ${theirAstro.moon}`,
          desc: "Your emotional energies complement each other — naturally harmonious inner world ✨",
        });
      }
    }
  }

  // === TỬ VI: Ngũ Hành Nạp Âm compatibility ===
  if (myAstro?.banMenh && theirAstro.banMenh) {
    const myHanh = extractNguHanh(myAstro.banMenh);
    const theirHanh = extractNguHanh(theirAstro.banMenh);
    if (myHanh && theirHanh) {
      const compat = NGU_HANH_COMPAT[myHanh]?.[theirHanh];
      if (compat) {
        reasons.push({
          icon: "☯️",
          title: `Tử Vi: ${compat.relation} (${myAstro.banMenh} × ${theirAstro.banMenh})`,
          desc: compat.desc,
        });
      }
    }
  }

  // === Fallback: if no specific compat but user has data, show general insight ===
  if (reasons.length === 0 && theirAstro.sun) {
    reasons.push({
      icon: "✨",
      title: `${theirName} is a ${theirAstro.sun}`,
      desc: `${ZODIAC_EMOJI[theirAstro.sun] || "✨"} ${theirAstro.sun} signs are known for their unique energy. Explore your cosmic connection!`,
    });
  }

  return reasons;
}

// ============================================
// COMPONENT
// ============================================

interface DailyPickCardProps {
  user: Doc<"users">;
  currentUser?: Doc<"users"> | null;
  matchScore: number;
  aiExplanation: string;
  sharedInterests: string[];
  onLike: () => void;
  isProcessing?: boolean;
}

export function DailyPickCard({
  user,
  currentUser,
  matchScore,
  aiExplanation,
  sharedInterests,
  onLike,
  isProcessing = false,
}: DailyPickCardProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = user.photos?.length
    ? user.photos
    : ["https://via.placeholder.com/400x500"];
  const currentPhoto = photos[currentPhotoIndex];

  // Convert score to percentage
  const percentage = Math.round(Math.min(Math.max(matchScore, 0), 1) * 100);

  const handlePhotoTap = (side: "left" | "right") => {
    if (side === "right") {
      setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length);
    } else if (side === "left") {
      setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  // Astrology data
  const theirAstro = user.astrologyData;
  const myAstro = currentUser?.astrologyData;
  const hasAstrologyData = theirAstro && (theirAstro.sun || theirAstro.canChi);

  // Build "Why You Match" compatibility reasons
  const compatReasons = buildCompatReasons(myAstro, theirAstro, user.name);

  // Header height for content inset
  const headerHeight = insets.top + 12 + 60 + 16;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* AI Match Card - The Hero */}
        <View style={styles.matchCard}>
          {/* Photo with gradient */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: currentPhoto }} style={styles.photo} />

            <PhotoIndicators
              count={photos.length}
              currentIndex={currentPhotoIndex}
              style={{ top: 12 }}
            />
            <PhotoTapZones onTap={handlePhotoTap} />

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.photoGradient}
            />

            {/* Name overlay with zodiac */}
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{user.name}, {user.age}</Text>
                {theirAstro?.sun && (
                  <Text style={styles.zodiacOverlay}>
                    {ZODIAC_EMOJI[theirAstro.sun] || "✨"}
                  </Text>
                )}
              </View>
              {user.gender && (
                <Text style={styles.gender}>
                  {user.gender === "woman" ? "♀" : "♂"} {user.gender}
                </Text>
              )}
            </View>
          </View>

          {/* AI Insight Section */}
          <View style={[styles.insightSection, { backgroundColor: colors.primaryContainer }]}>
            <View style={styles.insightHeader}>
              <View style={[styles.matchBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.matchPercentage}>{percentage}% Match</Text>
              </View>
              <Text style={[styles.aiLabel, { color: colors.onPrimaryContainer }]}>
                AI Pick
              </Text>
            </View>
            
            <Text style={[styles.aiExplanation, { color: colors.onPrimaryContainer }]}>
              {aiExplanation}
            </Text>

            {/* Shared Interests with Like Button */}
            <View style={styles.sharedSection}>
              <View style={styles.sharedRow}>
                <View style={styles.sharedContent}>
                  {sharedInterests.length > 0 ? (
                    <>
                      <View style={styles.sharedHeader}>
                        <Ionicons name="heart" size={14} color={colors.primary} />
                        <Text style={[styles.sharedLabel, { color: colors.onPrimaryContainer }]}>
                          You both love
                        </Text>
                      </View>
                      <View style={styles.sharedChips}>
                        {sharedInterests.slice(0, 3).map((interest, index) => (
                          <View
                            key={index}
                            style={[styles.sharedChip, { backgroundColor: colors.primary + "20" }]}
                          >
                            <Text style={[styles.sharedChipText, { color: colors.primary }]}>
                              {interest}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.noSharedText, { color: colors.onPrimaryContainer }]}>
                      Tap to connect with {user.name}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[styles.likeButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    hapticButtonPress();
                    onLike();
                  }}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================ */}
        {/* COSMIC COMPATIBILITY SECTION */}
        {/* ============================================ */}
        {hasAstrologyData && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              COSMIC PROFILE
            </Text>

            {/* Their Zodiac Signs Row */}
            <View style={styles.zodiacProfileRow}>
              {theirAstro!.sun && (
                <View style={[styles.zodiacBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={styles.zodiacBadgeEmoji}>
                    {ZODIAC_EMOJI[theirAstro!.sun] || "☀️"}
                  </Text>
                  <View style={styles.zodiacBadgeText}>
                    <Text style={[styles.zodiacBadgeLabel, { color: colors.onPrimaryContainer }]}>Sun</Text>
                    <Text style={[styles.zodiacBadgeValue, { color: colors.onPrimaryContainer }]}>{theirAstro!.sun}</Text>
                  </View>
                  <Text style={styles.zodiacElement}>{ZODIAC_ELEMENTS[theirAstro!.sun]?.emoji || ""}</Text>
                </View>
              )}

              {theirAstro!.moon && theirAstro!.moon !== "Unknown" && (
                <View style={[styles.zodiacBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={styles.zodiacBadgeEmoji}>{ZODIAC_EMOJI[theirAstro!.moon] || "🌙"}</Text>
                  <View style={styles.zodiacBadgeText}>
                    <Text style={[styles.zodiacBadgeLabel, { color: colors.onPrimaryContainer }]}>Moon</Text>
                    <Text style={[styles.zodiacBadgeValue, { color: colors.onPrimaryContainer }]}>{theirAstro!.moon}</Text>
                  </View>
                </View>
              )}

              {theirAstro!.rising && theirAstro!.rising !== "Unknown" && (
                <View style={[styles.zodiacBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={styles.zodiacBadgeEmoji}>{ZODIAC_EMOJI[theirAstro!.rising] || "⬆️"}</Text>
                  <View style={styles.zodiacBadgeText}>
                    <Text style={[styles.zodiacBadgeLabel, { color: colors.onPrimaryContainer }]}>Rising</Text>
                    <Text style={[styles.zodiacBadgeValue, { color: colors.onPrimaryContainer }]}>{theirAstro!.rising}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Vietnamese Tử Vi Row */}
            {theirAstro!.canChi && theirAstro!.canChi !== "Ẩn số" && (
              <View style={[styles.tuViRow, { backgroundColor: colors.primaryContainer + "60" }]}>
                <Text style={styles.tuViEmoji}>☯️</Text>
                <View style={styles.tuViTextContainer}>
                  <Text style={[styles.tuViLabel, { color: colors.onSurfaceVariant }]}>Tử Vi</Text>
                  <Text style={[styles.tuViValue, { color: colors.onBackground }]}>
                    {theirAstro!.canChi} · {theirAstro!.banMenh}
                  </Text>
                </View>
              </View>
            )}

            {/* ===== WHY YOU MATCH ===== */}
            {compatReasons.length > 0 && (
              <View style={styles.compatSection}>
                <View style={styles.compatHeader}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <Text style={[styles.compatTitle, { color: colors.onBackground }]}>
                    Why You Match
                  </Text>
                </View>

                {compatReasons.map((reason, i) => (
                  <View key={i} style={[styles.compatReason, { backgroundColor: colors.primaryContainer + "40" }]}>
                    <View style={styles.compatReasonHeader}>
                      <Text style={styles.compatReasonIcon}>{reason.icon}</Text>
                      <Text style={[styles.compatReasonTitle, { color: colors.onBackground }]}>
                        {reason.title}
                      </Text>
                    </View>
                    <Text style={[styles.compatReasonDesc, { color: colors.onSurfaceVariant }]}>
                      {reason.desc}
                    </Text>
                  </View>
                ))}

                {/* Side-by-side zodiac comparison */}
                {myAstro?.sun && theirAstro?.sun && (
                  <View style={[styles.zodiacCompare, { borderColor: colors.outline + "30" }]}>
                    <View style={styles.zodiacCompareUser}>
                      <Text style={styles.zodiacCompareEmoji}>{ZODIAC_EMOJI[myAstro.sun] || "✨"}</Text>
                      <Text style={[styles.zodiacCompareName, { color: colors.onSurfaceVariant }]}>You</Text>
                      <Text style={[styles.zodiacCompareSign, { color: colors.onBackground }]}>{myAstro.sun}</Text>
                      <Text style={styles.zodiacCompareElement}>
                        {ZODIAC_ELEMENTS[myAstro.sun]?.emoji} {ZODIAC_ELEMENTS[myAstro.sun]?.element}
                      </Text>
                    </View>
                    <View style={styles.zodiacCompareDivider}>
                      <Ionicons name="heart" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.zodiacCompareUser}>
                      <Text style={styles.zodiacCompareEmoji}>{ZODIAC_EMOJI[theirAstro.sun] || "✨"}</Text>
                      <Text style={[styles.zodiacCompareName, { color: colors.onSurfaceVariant }]}>{user.name}</Text>
                      <Text style={[styles.zodiacCompareSign, { color: colors.onBackground }]}>{theirAstro.sun}</Text>
                      <Text style={styles.zodiacCompareElement}>
                        {ZODIAC_ELEMENTS[theirAstro.sun]?.emoji} {ZODIAC_ELEMENTS[theirAstro.sun]?.element}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Bio Section */}
        {user.bio && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>ABOUT</Text>
            <Text style={[styles.bio, { color: colors.onBackground }]}>{user.bio}</Text>
          </View>
        )}

        {/* All Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>INTERESTS</Text>
            <View style={styles.interestsGrid}>
              {user.interests.map((interest, index) => {
                const isShared = sharedInterests.includes(interest);
                return (
                  <View
                    key={`${interest}-${index}`}
                    style={[
                      styles.interestChip,
                      { 
                        backgroundColor: isShared ? colors.primaryContainer : colors.surfaceVariant,
                        borderColor: isShared ? colors.primary : "transparent",
                        borderWidth: isShared ? 1.5 : 0,
                      },
                    ]}
                  >
                    {isShared && <Ionicons name="heart" size={12} color={colors.primary} />}
                    <Text style={[styles.interestText, { color: isShared ? colors.primary : colors.onSurfaceVariant }]}>
                      {interest}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Looking For */}
        {user.lookingFor && user.lookingFor.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>LOOKING FOR</Text>
            <View style={styles.lookingForRow}>
              <Ionicons name="heart-outline" size={18} color={colors.primary} />
              <Text style={[styles.lookingForText, { color: colors.onBackground }]}>
                {user.lookingFor.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(" & ")}
                {" · "}
                {user.ageRange?.min || 18}-{user.ageRange?.max || 99} years
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  matchCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  photoContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.38,
    position: "relative",
  },
  photo: { width: "100%", height: "100%" },
  photoGradient: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: 120,
  },
  nameContainer: {
    position: "absolute",
    bottom: 16, left: 16, right: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  name: {
    fontSize: 28, fontWeight: "800", color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  zodiacOverlay: {
    fontSize: 22,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gender: {
    fontSize: 14, color: "rgba(255,255,255,0.8)",
    marginTop: 4, textTransform: "capitalize",
  },
  insightSection: { padding: 20 },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matchBadge: {
    flexDirection: "row", alignItems: "center",
    gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  matchPercentage: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  aiLabel: {
    fontSize: 11, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.6,
  },
  aiExplanation: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  sharedSection: { marginTop: 16 },
  sharedRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  sharedContent: { flex: 1 },
  sharedHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sharedLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  sharedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sharedChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  sharedChipText: { fontSize: 13, fontWeight: "600" },
  noSharedText: { fontSize: 15, fontWeight: "500" },
  likeButton: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },

  // ============================================
  // COSMIC PROFILE & COMPAT SECTION
  // ============================================
  zodiacProfileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  zodiacBadge: {
    flexDirection: "row", alignItems: "center",
    gap: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14, flex: 1, minWidth: 100,
  },
  zodiacBadgeEmoji: { fontSize: 22 },
  zodiacBadgeText: { flex: 1 },
  zodiacBadgeLabel: {
    fontSize: 10, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.7,
  },
  zodiacBadgeValue: { fontSize: 13, fontWeight: "700" },
  zodiacElement: { fontSize: 14 },
  tuViRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 12,
  },
  tuViEmoji: { fontSize: 20 },
  tuViTextContainer: { flex: 1 },
  tuViLabel: {
    fontSize: 10, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  tuViValue: { fontSize: 14, fontWeight: "600" },

  // Why You Match
  compatSection: { marginTop: 4 },
  compatHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 6, marginBottom: 10,
  },
  compatTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  compatReason: {
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  compatReasonHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginBottom: 6,
  },
  compatReasonIcon: { fontSize: 18 },
  compatReasonTitle: { fontSize: 13, fontWeight: "700", flex: 1 },
  compatReasonDesc: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
  zodiacCompare: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 16, paddingHorizontal: 12,
    marginTop: 8,
  },
  zodiacCompareUser: { flex: 1, alignItems: "center", gap: 4 },
  zodiacCompareEmoji: { fontSize: 32 },
  zodiacCompareName: {
    fontSize: 11, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  zodiacCompareSign: { fontSize: 14, fontWeight: "700" },
  zodiacCompareElement: { fontSize: 12, opacity: 0.8 },
  zodiacCompareDivider: { paddingHorizontal: 12 },

  // Standard sections
  section: { borderRadius: 20, padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 },
  bio: { fontSize: 16, lineHeight: 24 },
  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
  },
  interestText: { fontSize: 14, fontWeight: "500" },
  lookingForRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  lookingForText: { fontSize: 16, fontWeight: "500" },
});
