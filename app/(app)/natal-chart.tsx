import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/lib/theme";
import NatalChartView from "@/components/astrology/NatalChartView";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function NatalChartScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [houseSystem, setHouseSystem] = useState<"wholeSign" | "placidus">("wholeSign");

  const getChartData = useAction(api.astrology_api.getFullChartData);

  useEffect(() => {
    async function loadChartData() {
      try {
        if (!userId) throw new Error("No user ID provided");
        setIsLoading(true);
        const data = await getChartData({ userId: userId as Id<"users"> });
        setChartData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load chart data");
      } finally {
        setIsLoading(false);
      }
    }
    loadChartData();
  }, [userId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)")} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Bản Đồ Sao</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* House System Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            houseSystem === "wholeSign" && { backgroundColor: colors.primary }
          ]}
          onPress={() => setHouseSystem("wholeSign")}
        >
          <Text style={[
            styles.toggleText,
            houseSystem === "wholeSign" ? { color: "#FFF" } : { color: colors.onSurfaceVariant }
          ]}>Whole Sign (Toàn Cung)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            houseSystem === "placidus" && { backgroundColor: colors.primary }
          ]}
          onPress={() => setHouseSystem("placidus")}
        >
          <Text style={[
            styles.toggleText,
            houseSystem === "placidus" ? { color: "#FFF" } : { color: colors.onSurfaceVariant }
          ]}>Placidus (Phương Tây)</Text>
        </TouchableOpacity>
      </View>

      {/* Chart Area */}
      <View style={styles.chartContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : chartData ? (
          <View style={{ width: "100%", height: 420 }}>
             <NatalChartView 
               planets={chartData.planets}
               cusps={chartData.houses[houseSystem]}
               aspects={chartData.aspects}
               houseSystem={houseSystem}
             />
          </View>
        ) : null}
      </View>

      {/* Info Area below chart */}
      {chartData && (
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: colors.onBackground }]}>Phân tích góc nhìn</Text>
          <Text style={[styles.infoDesc, { color: colors.onSurfaceVariant }]}>
            {houseSystem === "wholeSign" 
              ? "Whole Sign (Toàn Cung) chia đều mỗi cung hoàng đạo thành 1 nhà. Đây là góc nhìn trực quan, dễ hiểu và tương đồng với logic của Tử Vi phương Đông, rất phù hợp cho người Việt Nam mới tiếp cận Bản đồ sao."
              : "Placidus tính toán các nhà dựa trên vị trí địa lý và thời gian chính xác, mang lại chiều sâu phân tích tâm lý, tính cách và mối quan hệ (AI sẽ dùng góc nhìn này để đánh giá độ tương hợp)."}
          </Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    gap: 8,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(100,100,100,0.1)",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    padding: 20,
  },
  infoContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
});
