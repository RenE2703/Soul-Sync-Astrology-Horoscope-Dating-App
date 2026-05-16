import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton } from "@/components/glass";
import { DistanceSlider, DISTANCE_STEPS } from "@/components/preferences";
import { HeaderIcon } from "@/components/ui";
import { AdaptiveGlassView } from "@/lib/glass";
import { hapticButtonPress, hapticSuccess } from "@/lib/haptics";
import {
  requestAndGetLocation,
  reverseGeocode,
  searchLocations,
  type GeoSearchResult,
  type LocationInfo,
} from "@/lib/location";
import { useAppTheme } from "@/lib/theme";

// Quick-select Vietnamese locations — appended to search input for street-level precision
const POPULAR_LOCATIONS = [
  { label: "TP. HCM", query: "Ho Chi Minh" },
  { label: "Hà Nội", query: "Hanoi" },
  { label: "Đà Nẵng", query: "Da Nang" },
  { label: "Bình Dương", query: "Binh Duong" },
  { label: "Đồng Nai", query: "Dong Nai" },
  { label: "Cần Thơ", query: "Can Tho" },
  { label: "Hải Phòng", query: "Hai Phong" },
  { label: "Nha Trang", query: "Nha Trang" },
  { label: "Huế", query: "Hue" },
  { label: "Vũng Tàu", query: "Vung Tau" },
  { label: "Đông Hòa", query: "Dong Hoa, Binh Duong" },
  { label: "Gò Vấp", query: "Go Vap, Ho Chi Minh" },
  { label: "Thủ Đức", query: "Thu Duc, Ho Chi Minh" },
  { label: "Dĩ An", query: "Di An, Binh Duong" },
];

export default function LocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  // Store slider position (0-4), default to 30 km (index 1)
  const [distanceIndex, setDistanceIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  // Manual location search state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);

  const maxDistance = DISTANCE_STEPS[distanceIndex];

  const handleQuickSelect = (query: string) => {
    hapticButtonPress();
    // If user already typed something (street name), append the city after it
    const currentText = manualQuery.trim();
    if (currentText && !currentText.includes(",")) {
      // User typed a street name like "Tan Lap" → append ", Dong Hoa, Binh Duong"
      setManualQuery(`${currentText}, ${query}`);
    } else {
      // No existing text or already has commas → replace with city query
      setManualQuery(query);
    }
    setShowManualInput(true);
  };

  const handleEnableLocation = async () => {
    hapticButtonPress();
    setIsLoading(true);

    try {
      const result = await requestAndGetLocation();

      if (result.location) {
        setLocationGranted(true);
        setLocationCoords(result.location);
        setLocationInfo(result.locationInfo);
        setSearchResults([]);
        hapticSuccess();
      } else {
        // GPS failed — show manual input
        Alert.alert(
          "Không thể lấy vị trí tự động",
          "GPS không hoạt động. Bạn có thể nhập địa chỉ/tên quận để thiết lập vị trí chính xác.",
          [
            { text: "Nhập thủ công", onPress: () => setShowManualInput(true) },
            { text: "Thử lại", style: "cancel" },
          ]
        );
      }
    } catch (error) {
      console.error("Failed to get location:", error);
      Alert.alert(
        "Lỗi",
        "Không thể lấy vị trí. Bạn có thể nhập địa chỉ thay thế.",
        [
          { text: "Nhập thủ công", onPress: () => setShowManualInput(true) },
          { text: "OK", style: "cancel" },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!manualQuery.trim()) return;

    hapticButtonPress();
    setIsSearching(true);
    setSearchResults([]);

    try {
      const results = await searchLocations(manualQuery.trim());
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        Alert.alert(
          "Không tìm thấy",
          `Không tìm thấy "${manualQuery}". Thử nhập chi tiết hơn, ví dụ: "Tân Lập, Đông Hòa, Bình Dương"`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: GeoSearchResult) => {
    hapticButtonPress();
    setIsSearching(true);

    try {
      // Get a clean display name from reverse geocoding the precise coordinates
      const info = await reverseGeocode(result.location);
      
      setLocationGranted(true);
      setLocationCoords(result.location);
      setLocationInfo(info);
      setSearchResults([]);
      setShowManualInput(false);
      hapticSuccess();
      
      console.log(
        "[Location] User selected:",
        info.displayName,
        `(${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)})`,
        "type:", result.type
      );
    } catch (error) {
      console.error("Select result failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleContinue = () => {
    hapticButtonPress();
    router.push({
      pathname: "/(app)/onboarding/bio",
      params: {
        ...params,
        ...(maxDistance !== undefined && { maxDistance: maxDistance.toString() }),
        ...(locationCoords && {
          latitude: locationCoords.latitude.toString(),
          longitude: locationCoords.longitude.toString(),
        }),
        ...(locationInfo?.displayName && {
          locationName: locationInfo.displayName,
        }),
      },
    });
  };

  const handleSkip = () => {
    hapticButtonPress();
    router.push({
      pathname: "/(app)/onboarding/bio",
      params: {
        ...params,
        ...(maxDistance !== undefined && { maxDistance: maxDistance.toString() }),
      },
    });
  };

  const renderSearchResult = ({ item }: { item: GeoSearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surfaceVariant }]}
      onPress={() => handleSelectResult(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons
          name={
            item.type === "city" || item.type === "town"
              ? "business"
              : item.type === "state" || item.type === "province"
                ? "map"
                : "location"
          }
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.resultTextContainer}>
        <Text
          style={[styles.resultName, { color: colors.onBackground }]}
          numberOfLines={2}
        >
          {item.displayName}
        </Text>
        <Text style={[styles.resultCoords, { color: colors.onSurfaceVariant }]}>
          {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
          {" · "}
          {item.type}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.questionContainer}
        >
          <HeaderIcon icon="location-outline" />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Enable location
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            We use your location to show you people nearby
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.locationContainer}
        >
          {/* Location Status */}
          <AdaptiveGlassView
            style={styles.statusCard}
            fallbackColor={
              locationGranted ? colors.primaryContainer : colors.surfaceVariant
            }
          >
            <Text style={styles.statusEmoji}>
              {locationGranted ? "✅" : "📍"}
            </Text>
            <View style={styles.statusTextContainer}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: locationGranted
                      ? colors.onPrimaryContainer
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {locationGranted ? "Đã thiết lập vị trí" : "Chưa thiết lập vị trí"}
              </Text>
              {locationGranted && locationInfo?.displayName && (
                <Text
                  style={[
                    styles.locationName,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  {locationInfo.displayName}
                </Text>
              )}
              {locationGranted && locationCoords && (
                <Text
                  style={[
                    styles.coordsText,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  📐 {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </AdaptiveGlassView>

          {/* GPS Button */}
          {!locationGranted && (
            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: colors.primary }]}
              onPress={handleEnableLocation}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.enableButtonText}>Đang lấy vị trí...</Text>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <Ionicons name="navigate" size={20} color="#FFFFFF" />
                  <Text style={styles.enableButtonText}>Lấy vị trí tự động (GPS)</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Manual Search Input */}
          {!locationGranted && (
            <>
              {!showManualInput ? (
                <TouchableOpacity
                  style={[styles.manualButton, { borderColor: colors.outline }]}
                  onPress={() => setShowManualInput(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search" size={20} color={colors.onSurfaceVariant} />
                  <Text style={[styles.manualButtonText, { color: colors.onSurfaceVariant }]}>
                    Hoặc nhập địa chỉ / tên quận
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.manualInputContainer}>
                  <Text style={[styles.searchHint, { color: colors.onSurfaceVariant }]}>
                    📍 Nhập tên đường + quận/thành phố để tọạ độ chính xác nhất
                  </Text>
                  <View
                    style={[
                      styles.searchRow,
                      { borderColor: colors.primary, backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Ionicons name="search" size={20} color={colors.onSurfaceVariant} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.onBackground }]}
                      placeholder="VD: Tan Lap, Dong Hoa, Binh Duong"
                      placeholderTextColor={colors.onSurfaceVariant + "80"}
                      value={manualQuery}
                      onChangeText={setManualQuery}
                      autoFocus
                      returnKeyType="search"
                      onSubmitEditing={handleSearch}
                    />
                    {manualQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setManualQuery("")}>
                        <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.searchButton,
                      {
                        backgroundColor: manualQuery.trim()
                          ? colors.primary
                          : colors.surfaceVariant,
                      },
                    ]}
                    onPress={handleSearch}
                    disabled={isSearching || !manualQuery.trim()}
                    activeOpacity={0.8}
                  >
                    {isSearching ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text
                        style={[
                          styles.searchButtonText,
                          {
                            color: manualQuery.trim() ? "#FFFFFF" : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        Tìm kiếm
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsTitle, { color: colors.onSurfaceVariant }]}>
                Chọn vị trí chính xác nhất:
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(_, i) => i.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            </View>
          )}

          {/* Quick-select popular cities */}
          {!locationGranted && showManualInput && searchResults.length === 0 && !isSearching && (
            <View style={styles.quickSelectContainer}>
              <Text style={[styles.quickSelectTitle, { color: colors.onSurfaceVariant }]}>
                Bấm để điền vào ô tìm kiếm (gõ tên đường trước, rồi bấm):
              </Text>
              <View style={styles.quickSelectGrid}>
                {POPULAR_LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc.query}
                    style={[styles.quickSelectChip, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => handleQuickSelect(loc.query)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickSelectText, { color: colors.onBackground }]}>
                      {loc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Change location button */}
          {locationGranted && (
            <TouchableOpacity
              style={[styles.changeButton, { borderColor: colors.outline }]}
              onPress={() => {
                setLocationGranted(false);
                setLocationCoords(null);
                setLocationInfo(null);
                setSearchResults([]);
                setShowManualInput(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={[styles.changeButtonText, { color: colors.primary }]}>
                Đổi vị trí
              </Text>
            </TouchableOpacity>
          )}

          {/* Distance Slider */}
          <View style={styles.sliderSection}>
            <DistanceSlider value={distanceIndex} onChange={setDistanceIndex} />
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(300).duration(500)}
        style={styles.footer}
      >
        <GlassButton onPress={handleContinue} label="Continue" />
        {!locationGranted && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: colors.onSurfaceVariant }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  questionContainer: { marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 17, lineHeight: 24 },
  locationContainer: { gap: 16 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  statusEmoji: { fontSize: 24 },
  statusTextContainer: { flex: 1, gap: 2 },
  statusText: { fontSize: 16, fontWeight: "500" },
  locationName: { fontSize: 14, fontWeight: "600", opacity: 0.9 },
  coordsText: { fontSize: 12, fontWeight: "400", opacity: 0.7, fontFamily: "monospace" },
  enableButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: "center",
  },
  enableButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  manualInputContainer: {
    gap: 10,
  },
  searchHint: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchButton: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    gap: 10,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  resultTextContainer: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  resultCoords: {
    fontSize: 11,
    fontWeight: "400",
    fontFamily: "monospace",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sliderSection: { marginTop: 8 },
  footer: { padding: 24, gap: 16 },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  quickSelectContainer: {
    gap: 10,
  },
  quickSelectTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  quickSelectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickSelectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
