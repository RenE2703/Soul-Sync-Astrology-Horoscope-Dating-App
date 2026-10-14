import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/lib/theme";
import { AdaptiveGlassView } from "@/lib/glass";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";
import NatalChartView from "@/components/astrology/NatalChartView";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Zodiac Vietnamese Mapping
const ZODIAC_VI: Record<string, { vi: string; symbol: string; element: string }> = {
  Aries:       { vi: "Bạch Dương", symbol: "♈", element: "Lửa" },
  Taurus:      { vi: "Kim Ngưu",   symbol: "♉", element: "Đất" },
  Gemini:      { vi: "Song Tử",    symbol: "♊", element: "Khí" },
  Cancer:      { vi: "Cự Giải",    symbol: "♋", element: "Nước" },
  Leo:         { vi: "Sư Tử",      symbol: "♌", element: "Lửa" },
  Virgo:       { vi: "Xử Nữ",      symbol: "♍", element: "Đất" },
  Libra:       { vi: "Thiên Bình", symbol: "♎", element: "Khí" },
  Scorpio:     { vi: "Bọ Cạp",     symbol: "♏", element: "Nước" },
  Sagittarius: { vi: "Nhân Mã",    symbol: "♐", element: "Lửa" },
  Capricorn:   { vi: "Ma Kết",     symbol: "♑", element: "Đất" },
  Aquarius:    { vi: "Bảo Bình",   symbol: "♒", element: "Khí" },
  Pisces:      { vi: "Song Ngư",   symbol: "♓", element: "Nước" },
};

// Planet Meanings
const PLANET_DESCRIPTIONS: Record<string, { vi: string; meaning: string; symbol: string }> = {
  Sun:       { vi: "Mặt Trời",     symbol: "☉", meaning: "Bản ngã cốt lõi, cá tính chủ đạo và năng lượng sống." },
  Moon:      { vi: "Mặt Trăng",     symbol: "☽", meaning: "Thế giới cảm xúc, tiềm thức, nhu cầu an toàn trong tình yêu." },
  Ascendant: { vi: "Cung Mọc",     symbol: "AC", meaning: "Diện mạo, ấn tượng ban đầu và cách bạn tiếp cận cuộc sống." },
  Mercury:   { vi: "Sao Thủy",      symbol: "☿", meaning: "Cách suy nghĩ, giao tiếp, biểu đạt tình cảm và trò chuyện." },
  Venus:     { vi: "Sao Kim",       symbol: "♀", meaning: "Ngôn ngữ tình yêu, vẻ đẹp quyến rũ và sở thích hẹn hò." },
  Mars:      { vi: "Sao Hỏa",       symbol: "♂", meaning: "Đam mê, năng lượng hành động, ham muốn và sự chủ động." },
  Jupiter:   { vi: "Sao Mộc",       symbol: "♃", meaning: "May mắn, sự hào phóng, triết lý sống và khả năng phát triển." },
  Saturn:    { vi: "Sao Thổ",       symbol: "♄", meaning: "Trách nhiệm, tính cam kết lâu dài và sự trưởng thành." },
  Uranus:    { vi: "Thiên Vương",   symbol: "♅", meaning: "Sự độc lập, cá tính riêng biệt và những bất ngờ thú vị." },
  Neptune:   { vi: "Hải Vương",     symbol: "♆", meaning: "Trực giác, sự lãng mạn mộng mơ và kết nối tâm hồn." },
  Pluto:     { vi: "Diêm Vương",    symbol: "♇", meaning: "Sức hút bí ẩn, sự chuyển hóa sâu sắc và chiều sâu tình cảm." },
  NorthNode: { vi: "Điểm Bắc (La Hầu)", symbol: "☊", meaning: "Bài học định mệnh và hướng phát triển linh hồn kiếp này." },
  Chiron:    { vi: "Chiron",        symbol: "⚷", meaning: "Vết thương tâm hồn và khả năng chữa lành cho người khác." },
};

// House Meanings
const HOUSE_MEANINGS: Record<number, { title: string; area: string }> = {
  1:  { title: "Bản Thân & Diện Mạo", area: "Cá tính, năng lượng đầu tiên và cách thể hiện với thế giới." },
  2:  { title: "Tài Chính & Giá Trị",  area: "Tiền bạc, tài sản cá nhân và cảm giác an toàn vật chất." },
  3:  { title: "Giao Tiếp & Học Hỏi",  area: "Trò chuyện, học vấn, bạn bè gần gũi và các chuyến đi ngắn." },
  4:  { title: "Gia Đình & Cội Nguồn", area: "Tổ ấm, quá khứ, tuổi thơ và cảm xúc an trú sâu kín." },
  5:  { title: "Tình Yêu & Sáng Tạo",  area: "Hẹn hò lãng mạn, rung động con tim, niềm vui và con cái." },
  6:  { title: "Sức Khỏe & Thói Quen", area: "Lối sống hàng ngày, công việc chi tiết và chăm sóc cơ thể." },
  7:  { title: "Hôn Nhân & Đối Tác",   area: "Mối quan hệ cam kết, đối tác đời và mẫu người bạn tìm kiếm." },
  8:  { title: "Chiều Sâu & Tái Sinh", area: "Sự gắn kết mật thiết, tình dục, tài sản chung và tâm linh." },
  9:  { title: "Tri Thức & Du Lịch",   area: "Triết lý, du lịch phương xa, niềm tin và thế giới quan." },
  10: { title: "Sự Nghiệp & Danh Vọng", area: "Mục tiêu cuộc đời, sự nghiệp và vị thế xã hội." },
  11: { title: "Cộng Đồng & Ước Mơ",   area: "Tình bạn, hội nhóm cùng chí hướng và lý tưởng tương lai." },
  12: { title: "Tiềm Thức & Nghiệp Quả", area: "Thế giới vô thức, sự tĩnh lặng, tâm linh và sự chữa lành." },
};

export default function NatalChartScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [houseSystem, setHouseSystem] = useState<"wholeSign" | "placidus">("wholeSign");
  const [activeTab, setActiveTab] = useState<"overview" | "planets" | "houses" | "aspects">("overview");

  const getChartData = useAction(api.astrology_api.getFullChartData);

  const loadChartData = async () => {
    try {
      if (!userId) throw new Error("Chưa có ID người dùng để tải bản đồ sao");
      setIsLoading(true);
      setError(null);
      const data = await getChartData({ userId: userId as Id<"users"> });
      setChartData(data);
    } catch (err: any) {
      console.error("[NatalChartScreen] load error:", err);
      setError(err.message || "Không thể tải dữ liệu bản đồ sao. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [userId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)/profile"))}
          style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Bản Đồ Sao Chi Tiết</Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Natal Birth Chart</Text>
        </View>
        <TouchableOpacity
          onPress={() => loadChartData()}
          style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* House System Switcher */}
        <View style={styles.toggleWrapper}>
          <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                houseSystem === "wholeSign" && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                hapticSelection();
                setHouseSystem("wholeSign");
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: houseSystem === "wholeSign" ? "#FFFFFF" : colors.onSurfaceVariant },
                ]}
              >
                Whole Sign (Toàn Cung)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                houseSystem === "placidus" && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                hapticSelection();
                setHouseSystem("placidus");
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: houseSystem === "placidus" ? "#FFFFFF" : colors.onSurfaceVariant },
                ]}
              >
                Placidus (Phương Tây)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visual Chart Wheel Area */}
        <View style={styles.chartWrapper}>
          {isLoading ? (
            <View style={[styles.loadingBox, { backgroundColor: colors.surfaceVariant }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Đang dựng thiên bàn & tính toán toạ độ...
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.error }]}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
              <Text style={[styles.errorTitle, { color: colors.onBackground }]}>Không thể dựng bản đồ sao</Text>
              <Text style={[styles.errorDesc, { color: colors.onSurfaceVariant }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={loadChartData}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Thử lại ngay</Text>
              </TouchableOpacity>
            </View>
          ) : chartData ? (
            <View style={styles.chartCanvasContainer}>
              <NatalChartView
                planets={chartData.planets || []}
                cusps={chartData.houses?.[houseSystem] || []}
                aspects={chartData.aspects || []}
                houseSystem={houseSystem}
                dom={{ scrollEnabled: false, style: { width: "100%", height: 460 } }}
              />
            </View>
          ) : null}
        </View>

        {/* Detail Tabs Bar */}
        {chartData && (
          <>
            <View style={styles.tabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                {[
                  { id: "overview", label: "Phân Tích", icon: "sparkles" },
                  { id: "planets", label: "Hành Tinh", icon: "planet" },
                  { id: "houses", label: "12 Cung Nhà", icon: "home" },
                  { id: "aspects", label: "Góc Chiếu", icon: "git-network" },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.tabItem,
                        {
                          backgroundColor: isActive ? colors.primary : colors.surfaceVariant,
                          borderColor: isActive ? colors.primary : "transparent",
                        },
                      ]}
                      onPress={() => {
                        hapticSelection();
                        setActiveTab(tab.id as any);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={tab.icon as any}
                        size={15}
                        color={isActive ? "#FFFFFF" : colors.onSurfaceVariant}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.tabItemText,
                          { color: isActive ? "#FFFFFF" : colors.onSurfaceVariant, fontWeight: isActive ? "700" : "500" },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* TAB CONTENT: Overview */}
            {activeTab === "overview" && (
              <View style={styles.tabPane}>
                <AdaptiveGlassView style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="compass-outline" size={20} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.onBackground }]}>
                      Góc Nhìn Hệ Nhà: {houseSystem === "wholeSign" ? "Whole Sign" : "Placidus"}
                    </Text>
                  </View>
                  <Text style={[styles.cardParagraph, { color: colors.onSurfaceVariant }]}>
                    {houseSystem === "wholeSign"
                      ? "Hệ thống Whole Sign (Toàn Cung) là phương pháp cổ điển chia đều mỗi cung hoàng đạo (30 độ) tương ứng trọn vẹn với 1 cung nhà. Cách phân bổ này trực quan, rành mạch và có tính đồng nhất cao với triết lý Tử Vi phương Đông — giúp bạn nhận diện bức tranh tổng thể về cuộc đời rõ ràng nhất."
                      : "Hệ thống Placidus là tiêu chuẩn chiêm tinh học phương Tây hiện đại, tính toán kích thước các cung nhà dựa trên vĩ độ sinh và trục thời gian chuẩn xác đến từng phút. Placidus đào sâu vào tâm lý, nội tâm tiềm thức và độ tương thích duyên phận giữa hai linh hồn."}
                  </Text>
                </AdaptiveGlassView>

                {/* Big Three Summary */}
                <View style={styles.bigThreeGrid}>
                  {chartData.planets
                    ?.filter((p: any) => p.name === "Sun" || p.name === "Moon" || p.name === "Ascendant")
                    .map((item: any) => {
                      const zodiac = ZODIAC_VI[item.sign] || { vi: item.sign, symbol: "⭐", element: "" };
                      const meta = PLANET_DESCRIPTIONS[item.name] || { vi: item.name, symbol: "●" };
                      return (
                        <AdaptiveGlassView key={item.name} style={styles.bigThreeCard}>
                          <Text style={styles.bigThreeSymbol}>{meta.symbol}</Text>
                          <Text style={[styles.bigThreeLabel, { color: colors.onSurfaceVariant }]}>{meta.vi}</Text>
                          <Text style={[styles.bigThreeValue, { color: colors.onBackground }]}>
                            {zodiac.symbol} {zodiac.vi}
                          </Text>
                          <Text style={[styles.bigThreeDegree, { color: colors.primary }]}>
                            {Math.floor(item.signDegree ?? item.degree % 30)}° Nhà {item.house || 1}
                          </Text>
                        </AdaptiveGlassView>
                      );
                    })}
                </View>

                {/* Elements Distribution */}
                {chartData.elements && (
                  <AdaptiveGlassView style={styles.card}>
                    <Text style={[styles.cardTitle, { color: colors.onBackground, marginBottom: 12 }]}>
                      Cân Bằng 4 Nguyên Tố Tự Nhiên
                    </Text>
                    <View style={styles.elementsRow}>
                      {[
                        { name: "Lửa (Fire)", count: chartData.elements.fire || 0, color: "#EF4444", icon: "flame" },
                        { name: "Đất (Earth)", count: chartData.elements.earth || 0, color: "#22C55E", icon: "leaf" },
                        { name: "Khí (Air)", count: chartData.elements.air || 0, color: "#F59E0B", icon: "cloud" },
                        { name: "Nước (Water)", count: chartData.elements.water || 0, color: "#3B82F6", icon: "water" },
                      ].map((el) => (
                        <View key={el.name} style={styles.elementCol}>
                          <Ionicons name={el.icon as any} size={20} color={el.color} />
                          <Text style={[styles.elementCount, { color: el.color }]}>{el.count}</Text>
                          <Text style={[styles.elementName, { color: colors.onSurfaceVariant }]}>{el.name}</Text>
                        </View>
                      ))}
                    </View>
                  </AdaptiveGlassView>
                )}
              </View>
            )}

            {/* TAB CONTENT: Planets List */}
            {activeTab === "planets" && (
              <View style={styles.tabPane}>
                {chartData.planets?.map((p: any) => {
                  const zodiac = ZODIAC_VI[p.sign] || { vi: p.sign, symbol: "✨", element: "" };
                  const meta = PLANET_DESCRIPTIONS[p.name] || { vi: p.name, symbol: "●", meaning: "" };
                  return (
                    <AdaptiveGlassView key={p.name} style={styles.listItemCard}>
                      <View style={styles.listItemHeader}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.planetGlyphLarge}>{meta.symbol}</Text>
                          <View>
                            <View style={styles.planetNameRow}>
                              <Text style={[styles.planetNameVi, { color: colors.onBackground }]}>{meta.vi}</Text>
                              {p.isRetrograde && <Text style={styles.retrogradeBadge}>℞ Nghịch hành</Text>}
                            </View>
                            <Text style={[styles.planetPlacement, { color: colors.primary }]}>
                              {zodiac.symbol} {zodiac.vi} {Math.floor(p.signDegree ?? p.degree % 30)}° · Nhà {p.house || 1}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.elementBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <Text style={[styles.elementBadgeText, { color: colors.onSurfaceVariant }]}>
                            {zodiac.element}
                          </Text>
                        </View>
                      </View>
                      {meta.meaning ? (
                        <Text style={[styles.itemDescription, { color: colors.onSurfaceVariant }]}>
                          {meta.meaning}
                        </Text>
                      ) : null}
                    </AdaptiveGlassView>
                  );
                })}
              </View>
            )}

            {/* TAB CONTENT: Houses List */}
            {activeTab === "houses" && (
              <View style={styles.tabPane}>
                {chartData.houses?.[houseSystem]?.map((h: any) => {
                  const zodiac = ZODIAC_VI[h.sign] || { vi: h.sign, symbol: "🏛️" };
                  const houseMeta = HOUSE_MEANINGS[h.house] || { title: `Cung Nhà ${h.house}`, area: "" };
                  return (
                    <AdaptiveGlassView key={h.house} style={styles.listItemCard}>
                      <View style={styles.houseRow}>
                        <View style={[styles.houseNumberBadge, { backgroundColor: colors.primary + "20" }]}>
                          <Text style={[styles.houseNumberText, { color: colors.primary }]}>
                            {h.house}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.houseHeaderRow}>
                            <Text style={[styles.houseTitle, { color: colors.onBackground }]}>
                              Nhà {h.house}: {houseMeta.title}
                            </Text>
                            <Text style={[styles.houseCuspSign, { color: colors.primary }]}>
                              {zodiac.symbol} {zodiac.vi} {Math.floor(h.signDegree ?? h.degree % 30)}°
                            </Text>
                          </View>
                          <Text style={[styles.itemDescription, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                            {houseMeta.area}
                          </Text>
                        </View>
                      </View>
                    </AdaptiveGlassView>
                  );
                })}
              </View>
            )}

            {/* TAB CONTENT: Aspects List */}
            {activeTab === "aspects" && (
              <View style={styles.tabPane}>
                {chartData.aspects && chartData.aspects.length > 0 ? (
                  chartData.aspects.map((asp: any, idx: number) => {
                    const p1 = PLANET_DESCRIPTIONS[asp.body1]?.vi || asp.body1;
                    const p2 = PLANET_DESCRIPTIONS[asp.body2]?.vi || asp.body2;
                    const sym1 = PLANET_DESCRIPTIONS[asp.body1]?.symbol || "●";
                    const sym2 = PLANET_DESCRIPTIONS[asp.body2]?.symbol || "●";

                    return (
                      <AdaptiveGlassView key={idx} style={styles.aspectCard}>
                        <View style={styles.aspectContent}>
                          <View style={styles.aspectPlanets}>
                            <Text style={styles.aspectGlyph}>{sym1}</Text>
                            <Ionicons name="link-outline" size={14} color={colors.onSurfaceVariant} style={{ marginHorizontal: 4 }} />
                            <Text style={styles.aspectGlyph}>{sym2}</Text>
                          </View>
                          <View style={{ flex: 1, marginHorizontal: 12 }}>
                            <Text style={[styles.aspectTitle, { color: colors.onBackground }]}>
                              {p1} & {p2}
                            </Text>
                            <Text style={[styles.aspectType, { color: colors.primary }]}>
                              {asp.type?.toUpperCase()} (Sai số {asp.orb}°)
                            </Text>
                          </View>
                        </View>
                      </AdaptiveGlassView>
                    );
                  })
                ) : (
                  <View style={styles.emptyAspects}>
                    <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                      Không có góc chiếu chính nào được ghi nhận.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Bottom Safety Margin */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 800,
    marginHorizontal: "auto",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  toggleWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    minHeight: 460,
  },
  chartCanvasContainer: {
    width: "100%",
    maxWidth: 460,
    height: 480,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    height: 380,
    width: "90%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    textAlign: "center",
  },
  errorBox: {
    height: 340,
    width: "90%",
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
  },
  errorDesc: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  tabsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabItemText: {
    fontSize: 13,
  },
  tabPane: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardParagraph: {
    fontSize: 13,
    lineHeight: 20,
  },
  bigThreeGrid: {
    flexDirection: "row",
    gap: 10,
  },
  bigThreeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
  },
  bigThreeSymbol: {
    fontSize: 22,
    marginBottom: 4,
  },
  bigThreeLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  bigThreeValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  bigThreeDegree: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  elementsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  elementCol: {
    alignItems: "center",
    flex: 1,
  },
  elementCount: {
    fontSize: 18,
    fontWeight: "800",
    marginVertical: 4,
  },
  elementName: {
    fontSize: 11,
    fontWeight: "500",
  },
  listItemCard: {
    padding: 14,
    borderRadius: 18,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planetGlyphLarge: {
    fontSize: 26,
    width: 32,
    textAlign: "center",
  },
  planetNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planetNameVi: {
    fontSize: 15,
    fontWeight: "700",
  },
  retrogradeBadge: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "700",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planetPlacement: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  elementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  elementBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  houseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  houseNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  houseNumberText: {
    fontSize: 16,
    fontWeight: "800",
  },
  houseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  houseTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  houseCuspSign: {
    fontSize: 13,
    fontWeight: "600",
  },
  aspectCard: {
    padding: 12,
    borderRadius: 16,
  },
  aspectContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aspectPlanets: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aspectGlyph: {
    fontSize: 16,
  },
  aspectTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  aspectType: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyAspects: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
