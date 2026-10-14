import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { GlassNavButton } from "@/components/glass";
import { PhotoItem } from "@/components/profile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdaptiveGlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress, hapticSelection, hapticSuccess } from "@/lib/haptics";
import { useReverseGeocode } from "@/lib/location";
import { AppColors, useAppTheme } from "@/lib/theme";
import { api } from "@/convex/_generated/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.55;

// Zodiac sign emoji and element mapping
const ZODIAC_INFO: Record<string, { emoji: string; element: string; vi: string }> = {
  Aries:       { emoji: "♈", element: "Lửa",   vi: "Bạch Dương" },
  Taurus:      { emoji: "♉", element: "Đất",   vi: "Kim Ngưu" },
  Gemini:      { emoji: "♊", element: "Gió",   vi: "Song Tử" },
  Cancer:      { emoji: "♋", element: "Nước",  vi: "Cự Giải" },
  Leo:         { emoji: "♌", element: "Lửa",   vi: "Sư Tử" },
  Virgo:       { emoji: "♍", element: "Đất",   vi: "Xử Nữ" },
  Libra:       { emoji: "♎", element: "Gió",   vi: "Thiên Bình" },
  Scorpio:     { emoji: "♏", element: "Nước",  vi: "Bọ Cạp" },
  Sagittarius: { emoji: "♐", element: "Lửa",   vi: "Nhân Mã" },
  Capricorn:   { emoji: "♑", element: "Đất",   vi: "Ma Kết" },
  Aquarius:    { emoji: "♒", element: "Gió",   vi: "Bảo Bình" },
  Pisces:      { emoji: "♓", element: "Nước",  vi: "Song Ngư" },
};

// Hán-Việt translation helpers
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

function toViet(raw: string): string {
  if (!raw) return raw;
  if (NA_YIN_VI[raw]) return NA_YIN_VI[raw];
  return raw.replace(/[\u4e00-\u9fff]/g, (ch) => HAN_VIET[ch] ?? ch);
}

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { signOut } = useAuth();
  const { currentUser: profile, clerkUser } = useCurrentUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");

  // Local settings toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pauseAccount, setPauseAccount] = useState(false);

  // Mutations
  const updateProfile = useMutation(api.users.updateProfile);
  const deleteAccount = useMutation(api.users.deleteAccount);

  // Use stored locationName from DB; fall back to reverse geocoding if not stored
  const { locationInfo: geocodedInfo } = useReverseGeocode(
    profile?.locationName ? null : profile?.location
  );
  const locationDisplayName = profile?.locationName || geocodedInfo?.displayName || null;

  const handleSignOut = () => {
    hapticButtonPress();
    Alert.alert(
      "Đăng Xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản SoulSync?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng Xuất",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    hapticButtonPress();
    Alert.alert(
      "Xóa Tài Khoản Vĩnh Viễn",
      "CẢNH BÁO: Hành động này sẽ xóa toàn bộ hồ sơ, lượt tương hợp, tin nhắn trò chuyện và lịch sử chiêm tinh của bạn. Dữ liệu không thể phục hồi.",
      [
        { text: "Hủy bỏ", style: "cancel" },
        {
          text: "Tôi hiểu, Xóa tài khoản",
          style: "destructive",
          onPress: async () => {
            if (profile?._id) {
              try {
                await deleteAccount({ id: profile._id });
                await signOut();
                router.replace("/(auth)/sign-in");
              } catch (e) {
                console.error("Failed to delete account:", e);
                Alert.alert("Lỗi", "Không thể xóa tài khoản lúc này. Vui lòng thử lại sau.");
              }
            }
          },
        },
      ]
    );
  };

  const handleToggleAstrologySystem = async (system: "western" | "tuvi") => {
    if (!profile?._id) return;
    hapticSelection();
    try {
      await updateProfile({
        id: profile._id,
        preferredSystem: system,
      });
      hapticSuccess();
    } catch (e) {
      console.error("Failed to update preferred astrology system:", e);
    }
  };

  const handleEdit = () => {
    hapticButtonPress();
    router.push("/(app)/edit-profile");
  };

  const photos = profile?.photos?.length
    ? profile.photos
    : [`https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.name || clerkUser?.firstName || "user"}`];
  const currentPhoto = photos[currentPhotoIndex];

  const handlePhotoTap = (side: "left" | "right") => {
    if (side === "right") {
      setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length);
    } else if (side === "left") {
      setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  // Loading state
  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Đang tải dữ liệu hồ sơ...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Floating Segmented Navigation Bar */}
      <View style={[styles.topSwitcherContainer, { top: insets.top + 8 }]}>
        <View style={[styles.topSwitcherPill, { backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)" }]}>
          <TouchableOpacity
            style={[
              styles.switcherTab,
              activeTab === "profile" && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              hapticSelection();
              setActiveTab("profile");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "profile" ? "person" : "person-outline"}
              size={15}
              color={activeTab === "profile" ? "#FFFFFF" : colors.onSurfaceVariant}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.switcherText,
                { color: activeTab === "profile" ? "#FFFFFF" : colors.onSurfaceVariant },
              ]}
            >
              Hồ Sơ Của Tôi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switcherTab,
              activeTab === "settings" && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              hapticSelection();
              setActiveTab("settings");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === "settings" ? "settings" : "settings-outline"}
              size={15}
              color={activeTab === "settings" ? "#FFFFFF" : colors.onSurfaceVariant}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.switcherText,
                { color: activeTab === "settings" ? "#FFFFFF" : colors.onSurfaceVariant },
              ]}
            >
              Cài Đặt & Tài Khoản
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VIEW 1: PUBLIC PROFILE PREVIEW */}
      {activeTab === "profile" ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <PhotoItem storageId={currentPhoto} style={styles.photo} />

            {/* Gradient Overlay */}
            <LinearGradient
              colors={["transparent", "transparent", "rgba(0,0,0,0.65)"]}
              style={styles.gradient}
            />

            {/* Photo Navigation Indicators */}
            {photos.length > 1 && (
              <View style={[styles.photoIndicators, { top: insets.top + 56 }]}>
                {photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor:
                          index === currentPhotoIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                      },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Tap Zones for Photo Navigation */}
            <View style={styles.tapZones}>
              <TouchableOpacity
                style={styles.tapZoneLeft}
                onPress={() => handlePhotoTap("left")}
                activeOpacity={1}
              />
              <TouchableOpacity
                style={styles.tapZoneRight}
                onPress={() => handlePhotoTap("right")}
                activeOpacity={1}
              />
            </View>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <View style={styles.navButtonLeft}>
                  <GlassNavButton direction="left" onPress={() => handlePhotoTap("left")} />
                </View>
                <View style={styles.navButtonRight}>
                  <GlassNavButton direction="right" onPress={() => handlePhotoTap("right")} />
                </View>
              </>
            )}

            {/* Name & Age Overlay */}
            <View style={styles.nameOverlay}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.age}>{profile.age}</Text>
              </View>
              {profile.gender && (
                <View style={styles.genderRow}>
                  <Text style={styles.genderIcon}>
                    {profile.gender === "woman" ? "♀" : "♂"}
                  </Text>
                  <Text style={styles.genderText}>{profile.gender}</Text>
                </View>
              )}
              {locationDisplayName && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#FFFFFF" style={styles.locationIcon} />
                  <Text style={styles.locationText}>{locationDisplayName}</Text>
                </View>
              )}
            </View>

            {/* Floating Edit Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.9}
            >
              {supportsGlassEffect ? (
                <AdaptiveGlassView style={styles.editButtonGlass} tintColor={colors.primary}>
                  <Ionicons name="pencil" size={22} color="#FFFFFF" />
                </AdaptiveGlassView>
              ) : (
                <LinearGradient
                  colors={[AppColors.primary, "#FF4458"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.editButtonGlass, styles.editButtonFallback]}
                >
                  <Ionicons name="pencil" size={22} color="#FFFFFF" />
                </LinearGradient>
              )}
              <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 20 }} />
            </TouchableOpacity>
          </View>

          {/* Photo Gallery Thumbnails */}
          {photos.length > 1 && (
            <View style={styles.photoGallerySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoGalleryContent}
              >
                {photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.galleryPhotoContainer,
                      index === currentPhotoIndex && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => setCurrentPhotoIndex(index)}
                    activeOpacity={0.8}
                  >
                    <PhotoItem storageId={photo} style={styles.galleryPhoto} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Profile Details Content Section */}
          <View style={styles.contentSection}>
            {/* Bio */}
            {profile.bio && (
              <View style={styles.bioSection}>
                <Text style={[styles.bioQuote, { color: colors.primary }]}>&ldquo;</Text>
                <Text style={[styles.bioText, { color: colors.onBackground }]}>
                  {profile.bio}
                </Text>
              </View>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsSection}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                  SỞ THÍCH & ĐAM MÊ
                </Text>
                <View style={styles.interestsGrid}>
                  {profile.interests.map((interest) => (
                    <AdaptiveGlassView
                      key={interest}
                      style={[styles.interestChip, styles.interestChipOutline]}
                      fallbackColor="transparent"
                      fallbackStyle={{ borderColor: colors.outline }}
                    >
                      <Text style={[styles.interestText, { color: colors.onBackground }]}>
                        {interest}
                      </Text>
                    </AdaptiveGlassView>
                  ))}
                </View>
              </View>
            )}

            {/* Astrology Cosmic Profile */}
            {profile.astrologyData && (
              <View style={styles.astrologySection}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                  HỒ SƠ VŨ TRỤ (COSMIC IDENTITY)
                </Text>
                <View style={styles.astrologyGrid}>
                  {/* Sun Sign */}
                  <AdaptiveGlassView style={styles.astrologyCard}>
                    <Text style={styles.astrologyEmoji}>
                      {ZODIAC_INFO[profile.astrologyData.sun]?.emoji || "☀️"}
                    </Text>
                    <Text style={[styles.astrologyLabel, { color: colors.onSurfaceVariant }]}>Thái Dương</Text>
                    <Text style={[styles.astrologyValue, { color: colors.onBackground }]}>
                      {ZODIAC_INFO[profile.astrologyData.sun]?.vi || profile.astrologyData.sun}
                    </Text>
                    <Text style={[styles.astrologyElement, { color: colors.primary }]}>
                      {ZODIAC_INFO[profile.astrologyData.sun]?.element || ""}
                    </Text>
                  </AdaptiveGlassView>

                  {/* Moon Sign */}
                  <AdaptiveGlassView style={styles.astrologyCard}>
                    <Text style={styles.astrologyEmoji}>
                      {ZODIAC_INFO[profile.astrologyData.moon]?.emoji || "🌙"}
                    </Text>
                    <Text style={[styles.astrologyLabel, { color: colors.onSurfaceVariant }]}>Mặt Trăng</Text>
                    <Text style={[styles.astrologyValue, { color: colors.onBackground }]}>
                      {ZODIAC_INFO[profile.astrologyData.moon]?.vi || profile.astrologyData.moon}
                    </Text>
                    <Text style={[styles.astrologyElement, { color: colors.primary }]}>
                      {ZODIAC_INFO[profile.astrologyData.moon]?.element || ""}
                    </Text>
                  </AdaptiveGlassView>

                  {/* Rising Sign */}
                  <AdaptiveGlassView style={styles.astrologyCard}>
                    <Text style={styles.astrologyEmoji}>
                      {ZODIAC_INFO[profile.astrologyData.rising]?.emoji || "⬆️"}
                    </Text>
                    <Text style={[styles.astrologyLabel, { color: colors.onSurfaceVariant }]}>Cung Mọc</Text>
                    <Text style={[styles.astrologyValue, { color: colors.onBackground }]}>
                      {ZODIAC_INFO[profile.astrologyData.rising]?.vi || profile.astrologyData.rising}
                    </Text>
                    <Text style={[styles.astrologyElement, { color: colors.primary }]}>
                      {ZODIAC_INFO[profile.astrologyData.rising]?.element || ""}
                    </Text>
                  </AdaptiveGlassView>
                </View>

                {/* Vietnamese Tu Vi */}
                {profile.astrologyData.canChi && profile.astrologyData.canChi !== "Ẩn số" && (
                  <AdaptiveGlassView style={styles.tuViCard}>
                    <View style={styles.tuViContent}>
                      <View style={[styles.tuViIcon, { backgroundColor: colors.primary + "20" }]}>
                        <Text style={{ fontSize: 20 }}>☯️</Text>
                      </View>
                      <View style={styles.tuViDetails}>
                        <Text style={[styles.tuViLabel, { color: colors.onSurfaceVariant }]}>Tử Vi · Can Chi & Bản Mệnh</Text>
                        <Text style={[styles.tuViValue, { color: colors.onBackground }]}>
                          {toViet(profile.astrologyData.canChi)} · {toViet(profile.astrologyData.banMenh)}
                        </Text>
                      </View>
                    </View>
                  </AdaptiveGlassView>
                )}

                {/* View Full Chart Button */}
                <TouchableOpacity
                  style={[
                    styles.viewChartButton,
                    {
                      backgroundColor: colors.primary + "15",
                      borderColor: colors.primary + "35",
                    },
                  ]}
                  onPress={() => {
                    hapticButtonPress();
                    router.push(`/natal-chart?userId=${profile._id}`);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="planet" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.viewChartText, { color: colors.primary }]}>
                    Xem Bản Đồ Sao Chi Tiết
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* Looking For Card */}
            {profile.lookingFor && profile.lookingFor.length > 0 && (
              <View style={styles.lookingForSection}>
                <AdaptiveGlassView style={styles.lookingForCard}>
                  <View style={styles.lookingForContent}>
                    <View style={[styles.lookingForIcon, { backgroundColor: colors.primary + "20" }]}>
                      <Ionicons name="heart" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.lookingForDetails}>
                      <Text style={[styles.lookingForLabel, { color: colors.onSurfaceVariant }]}>
                        TIÊU CHÍ TÌM KIẾM
                      </Text>
                      <Text style={[styles.lookingForValue, { color: colors.onBackground }]}>
                        {profile.lookingFor.map((g) => (g === "woman" ? "Nữ" : g === "man" ? "Nam" : "Mọi người")).join(" & ")}
                        {" · "}
                        <Text style={{ fontWeight: "400", opacity: 0.7 }}>
                          {profile.ageRange?.min || 18}-{profile.ageRange?.max || 99} tuổi
                        </Text>
                      </Text>
                    </View>
                  </View>
                </AdaptiveGlassView>
              </View>
            )}

            {/* Quick Link to Settings */}
            <TouchableOpacity
              style={[styles.settingsShortcutCard, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => {
                hapticButtonPress();
                setActiveTab("settings");
              }}
              activeOpacity={0.8}
            >
              <View style={styles.settingsShortcutLeft}>
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.settingsShortcutTitle, { color: colors.onBackground }]}>
                    Cài Đặt & Quản Lý Tài Khoản
                  </Text>
                  <Text style={[styles.settingsShortcutSub, { color: colors.onSurfaceVariant }]}>
                    Tùy chọn tương hợp, khoảng cách, bảo mật & đăng xuất
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        /* VIEW 2: SETTINGS & ACCOUNT DASHBOARD */
        <ScrollView
          style={[styles.scrollView, { paddingTop: insets.top + 60 }]}
          contentContainerStyle={styles.settingsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Header Card in Settings */}
          <AdaptiveGlassView style={styles.userProfileCard}>
            <View style={styles.userProfileRow}>
              <View style={styles.userAvatarContainer}>
                <PhotoItem storageId={currentPhoto} style={styles.userAvatar} />
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.userNameHeader, { color: colors.onBackground }]}>
                  {profile.name}, {profile.age}
                </Text>
                <Text style={[styles.userEmailHeader, { color: colors.onSurfaceVariant }]}>
                  {clerkUser?.primaryEmailAddress?.emailAddress || "Chưa có email"}
                </Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>✨ Thành viên SoulSync</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.editProfileSmallButton, { backgroundColor: colors.primary + "18" }]}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.editProfileSmallText, { color: colors.primary }]}>Sửa</Text>
              </TouchableOpacity>
            </View>
          </AdaptiveGlassView>

          {/* SECTION 1: TÀI KHOẢN (ACCOUNT) */}
          <View style={styles.settingsSection}>
            <Text style={[styles.settingsSectionHeader, { color: colors.onSurfaceVariant }]}>
              TÀI KHOẢN
            </Text>
            <AdaptiveGlassView style={styles.settingsGroupCard}>
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Email</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                    {clerkUser?.primaryEmailAddress?.emailAddress || "Chưa thiết lập"}
                  </Text>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 4 }} />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Số điện thoại</Text>
                </View>
                <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                  {clerkUser?.primaryPhoneNumber?.phoneNumber || "Chưa liên kết"}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="finger-print-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Mã định danh</Text>
                </View>
                <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                  {profile._id ? `${profile._id.slice(0, 10)}...` : "—"}
                </Text>
              </View>
            </AdaptiveGlassView>
          </View>

          {/* SECTION 2: TIÊU CHÍ GHÉP ĐÔI (DISCOVERY PREFERENCES) */}
          <View style={styles.settingsSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.settingsSectionHeader, { color: colors.onSurfaceVariant }]}>
                TIÊU CHÍ TÌM KIẾM & GHÉP ĐÔI
              </Text>
              <TouchableOpacity onPress={handleEdit}>
                <Text style={[styles.editLink, { color: colors.primary }]}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>

            <AdaptiveGlassView style={styles.settingsGroupCard}>
              <TouchableOpacity style={styles.settingItemRow} onPress={handleEdit} activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="people-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Đang tìm kiếm</Text>
                </View>
                <View style={styles.settingValueContainer}>
                  <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                    {profile.lookingFor?.map((g) => (g === "woman" ? "Nữ" : g === "man" ? "Nam" : "Mọi người")).join(" & ") || "Mọi người"}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <TouchableOpacity style={styles.settingItemRow} onPress={handleEdit} activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Độ tuổi mong muốn</Text>
                </View>
                <View style={styles.settingValueContainer}>
                  <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                    {profile.ageRange?.min || 18} - {profile.ageRange?.max || 35} tuổi
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <TouchableOpacity style={styles.settingItemRow} onPress={handleEdit} activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="navigate-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Bán kính tối đa</Text>
                </View>
                <View style={styles.settingValueContainer}>
                  <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                    {profile.maxDistance ? `${profile.maxDistance} km` : "Toàn quốc"}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <TouchableOpacity style={styles.settingItemRow} onPress={handleEdit} activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Vị trí hẹn hò</Text>
                </View>
                <View style={styles.settingValueContainer}>
                  <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant, maxWidth: 160 }]} numberOfLines={1}>
                    {locationDisplayName || "Chưa thiết lập"}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </AdaptiveGlassView>
          </View>

          {/* SECTION 3: CÀI ĐẶT CHIÊM TINH (ASTROLOGY SETTINGS) */}
          <View style={styles.settingsSection}>
            <Text style={[styles.settingsSectionHeader, { color: colors.onSurfaceVariant }]}>
              HỆ THỐNG CHIÊM TINH & TÂM LINH
            </Text>
            <AdaptiveGlassView style={styles.settingsGroupCard}>
              {/* Astrology System Switcher */}
              <View style={styles.astrologySettingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>
                      Trọng tâm phân tích tương hợp
                    </Text>
                    <Text style={[styles.settingItemHelp, { color: colors.onSurfaceVariant }]}>
                      AI sẽ ưu tiên đối sánh góc chiếu hay Can Chi & Ngũ Hành
                    </Text>
                  </View>
                </View>

                {/* System Toggle Buttons */}
                <View style={[styles.miniToggleWrapper, { backgroundColor: colors.surfaceVariant }]}>
                  <TouchableOpacity
                    style={[
                      styles.miniToggleBtn,
                      (profile.preferredSystem ?? "western") === "western" && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleToggleAstrologySystem("western")}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.miniToggleText,
                        { color: (profile.preferredSystem ?? "western") === "western" ? "#FFFFFF" : colors.onSurfaceVariant },
                      ]}
                    >
                      Phương Tây
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.miniToggleBtn,
                      profile.preferredSystem === "tuvi" && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleToggleAstrologySystem("tuvi")}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.miniToggleText,
                        { color: profile.preferredSystem === "tuvi" ? "#FFFFFF" : colors.onSurfaceVariant },
                      ]}
                    >
                      Tử Vi Bát Tự
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() => {
                  hapticButtonPress();
                  router.push(`/natal-chart?userId=${profile._id}`);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="planet-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>
                    Khám phá Bản Đồ Sao của tôi
                  </Text>
                </View>
                <View style={styles.settingValueContainer}>
                  <Text style={[styles.settingItemValue, { color: colors.primary, fontWeight: "600" }]}>
                    Xem ngay
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            </AdaptiveGlassView>
          </View>

          {/* SECTION 4: ỨNG DỤNG & THÔNG BÁO (APP PREFERENCES) */}
          <View style={styles.settingsSection}>
            <Text style={[styles.settingsSectionHeader, { color: colors.onSurfaceVariant }]}>
              ỨNG DỤNG & THÔNG BÁO
            </Text>
            <AdaptiveGlassView style={styles.settingsGroupCard}>
              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>
                    Thông báo Tương hợp & Trò chuyện
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(val) => {
                    hapticSelection();
                    setNotificationsEnabled(val);
                  }}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="eye-off-outline" size={18} color={colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>
                      Tạm ẩn hồ sơ (Chế độ riêng tư)
                    </Text>
                    <Text style={[styles.settingItemHelp, { color: colors.onSurfaceVariant }]}>
                      Hồ sơ sẽ không xuất hiện trong lượt quẹt của người khác
                    </Text>
                  </View>
                </View>
                <Switch
                  value={pauseAccount}
                  onValueChange={(val) => {
                    hapticSelection();
                    setPauseAccount(val);
                  }}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </AdaptiveGlassView>
          </View>

          {/* SECTION 5: THÔNG TIN & PHÁP LÝ (LEGAL & ABOUT) */}
          <View style={styles.settingsSection}>
            <Text style={[styles.settingsSectionHeader, { color: colors.onSurfaceVariant }]}>
              VỀ SOULSYNC
            </Text>
            <AdaptiveGlassView style={styles.settingsGroupCard}>
              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() =>
                  Alert.alert(
                    "SoulSync Dating",
                    "SoulSync kết hợp trí tuệ nhân tạo (Gemini) cùng kho tàng Chiêm tinh Tây phương và Tử Vi Đông phương để tìm kiếm những kết nối tâm hồn chân thật nhất."
                  )
                }
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>
                    Giới thiệu ứng dụng
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <TouchableOpacity
                style={styles.settingItemRow}
                onPress={() =>
                  Alert.alert("Chính Sách Bảo Mật", "SoulSync cam kết bảo vệ dữ liệu cá nhân, tọa độ địa lý và hình ảnh riêng tư của bạn theo tiêu chuẩn quốc tế.")
                }
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>
                    Chính sách bảo mật & Điều khoản
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />

              <View style={styles.settingItemRow}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="code-slash-outline" size={18} color={colors.primary} />
                  <Text style={[styles.settingItemLabel, { color: colors.onBackground }]}>Phiên bản</Text>
                </View>
                <Text style={[styles.settingItemValue, { color: colors.onSurfaceVariant }]}>
                  1.0.0 (Build 2026)
                </Text>
              </View>
            </AdaptiveGlassView>
          </View>

          {/* SECTION 6: TÁC VỤ NGUY HIỂM & ĐĂNG XUẤT (ACTIONS) */}
          <View style={[styles.settingsSection, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[styles.actionButtonCard, { borderColor: "rgba(239, 68, 68, 0.4)" }]}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error || "#EF4444"} />
              <Text style={[styles.actionButtonText, { color: colors.error || "#EF4444" }]}>
                Đăng Xuất Khỏi Thiết Bị
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteAccountText}>
                Xóa tài khoản vĩnh viễn
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    maxWidth: 800,
    marginHorizontal: "auto",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 15,
  },
  // Top Segmented Switcher
  topSwitcherContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 30,
    alignItems: "center",
  },
  topSwitcherPill: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 4,
    maxWidth: 380,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  switcherTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 20,
  },
  switcherText: {
    fontSize: 13,
    fontWeight: "700",
  },
  // Photo Section
  photoSection: {
    width: "100%",
    height: PHOTO_HEIGHT,
    position: "relative",
    overflow: "visible",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: PHOTO_HEIGHT * 0.55,
  },
  photoIndicators: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  tapZones: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  tapZoneLeft: {
    flex: 1,
  },
  tapZoneRight: {
    flex: 1,
  },
  navButtonLeft: {
    position: "absolute",
    left: 12,
    top: "50%",
    marginTop: -18,
  },
  navButtonRight: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -18,
  },
  nameOverlay: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 80,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  age: {
    fontSize: 28,
    fontWeight: "400",
    color: "#FFFFFF",
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  genderIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  genderText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    textTransform: "capitalize",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationIcon: {
    opacity: 0.9,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.85,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editButton: {
    position: "absolute",
    bottom: -24,
    right: 24,
    zIndex: 10,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  editButtonGlass: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    position: "absolute",
  },
  editButtonFallback: {
    shadowColor: "#FF4458",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  // Photo Gallery
  photoGallerySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  photoGalleryContent: {
    gap: 10,
  },
  galleryPhotoContainer: {
    width: 70,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
  },
  galleryPhoto: {
    width: "100%",
    height: "100%",
  },
  // Content Section
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  bioSection: {
    marginBottom: 28,
  },
  bioQuote: {
    fontSize: 48,
    fontWeight: "300",
    lineHeight: 48,
    marginBottom: -8,
    marginLeft: -4,
  },
  bioText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  interestsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  interestChipOutline: {
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "transparent",
  },
  interestText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  astrologySection: {
    marginBottom: 28,
  },
  astrologyGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  astrologyCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  astrologyEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  astrologyLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  astrologyValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  astrologyElement: {
    fontSize: 11,
    fontWeight: "600",
  },
  tuViCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
  },
  tuViContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  tuViIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  tuViDetails: {
    flex: 1,
  },
  tuViLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  tuViValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  viewChartButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
  },
  viewChartText: {
    fontWeight: "700",
    fontSize: 15,
  },
  lookingForSection: {
    marginBottom: 20,
  },
  lookingForCard: {
    borderRadius: 20,
    padding: 18,
  },
  lookingForContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  lookingForIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  lookingForDetails: {
    flex: 1,
  },
  lookingForLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  lookingForValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingsShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  settingsShortcutLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingsShortcutTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  settingsShortcutSub: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomPadding: {
    height: 40,
  },
  // SETTINGS TAB STYLES
  settingsScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    maxWidth: 800,
    marginHorizontal: "auto",
    width: "100%",
  },
  userProfileCard: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 24,
  },
  userProfileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarContainer: {
    position: "relative",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  verifiedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userNameHeader: {
    fontSize: 18,
    fontWeight: "800",
  },
  userEmailHeader: {
    fontSize: 12,
    marginTop: 2,
  },
  memberBadge: {
    marginTop: 6,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  memberBadgeText: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "700",
  },
  editProfileSmallButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  editProfileSmallText: {
    fontSize: 13,
    fontWeight: "700",
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsSectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  editLink: {
    fontSize: 12,
    fontWeight: "700",
  },
  settingsGroupCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  settingItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  settingItemHelp: {
    fontSize: 11,
    marginTop: 2,
    marginLeft: 12,
    lineHeight: 16,
  },
  settingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingItemValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  astrologySettingItem: {
    paddingVertical: 14,
  },
  miniToggleWrapper: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 3,
    marginTop: 10,
  },
  miniToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  miniToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    width: "100%",
  },
  actionButtonCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  deleteAccountButton: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 8,
  },
  deleteAccountText: {
    fontSize: 13,
    color: "#94A3B8",
    textDecorationLine: "underline",
  },
});
