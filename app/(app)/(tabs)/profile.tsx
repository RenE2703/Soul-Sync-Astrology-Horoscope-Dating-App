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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassNavButton } from "@/components/glass";
import { PhotoItem } from "@/components/profile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdaptiveGlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { useReverseGeocode } from "@/lib/location";
import { AppColors, useAppTheme } from "@/lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { signOut } = useAuth();
  const { currentUser: profile, clerkUser } = useCurrentUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Get city name from coordinates
  const { locationInfo } = useReverseGeocode(profile?.location);

  const handleSignOut = () => {
    hapticButtonPress();
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [ 
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]
    );
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
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            colors={["transparent", "transparent", "rgba(0,0,0,0.6)"]}
            style={styles.gradient}
          />

          {/* Photo Navigation Indicators */}
          {photos.length > 1 && (
            <View style={[styles.photoIndicators, { top: insets.top + 12 }]}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: index === currentPhotoIndex
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.4)",
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
            {locationInfo?.displayName && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#FFFFFF" style={styles.locationIcon} />
                <Text style={styles.locationText}>{locationInfo.displayName}</Text>
              </View>
            )}
          </View>

          {/* Floating Edit Button - Inside photo section for proper scrolling */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.9}
          >
            {supportsGlassEffect ? (
              <AdaptiveGlassView style={styles.editButtonGlass} tintColor={colors.primary}>
                <Ionicons name="pencil" size={28} color="#FFFFFF" />
              </AdaptiveGlassView>
            ) : (
              <LinearGradient
                colors={[AppColors.primary, "#FF4458"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.editButtonGlass, styles.editButtonFallback]}
              >
                <Ionicons name="pencil" size={28} color="#FFFFFF" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Photo Gallery */}
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

        {/* Content Section - Matching ProfileView Design */}
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
                INTERESTS
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

          {/* Looking For */}
          {profile.lookingFor && profile.lookingFor.length > 0 && (
            <View style={styles.lookingForSection}>
              <AdaptiveGlassView style={styles.lookingForCard}>
                <View style={styles.lookingForContent}>
                  <View style={[styles.lookingForIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Ionicons name="heart" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.lookingForDetails}>
                    <Text style={[styles.lookingForLabel, { color: colors.onSurfaceVariant }]}>
                      Looking for
                    </Text>
                    <Text style={[styles.lookingForValue, { color: colors.onBackground }]}>
                      {profile.lookingFor.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(" & ")}
                      {" · "}
                      <Text style={{ fontWeight: "400", opacity: 0.7 }}>
                        {profile.ageRange?.min || 18}-{profile.ageRange?.max || 99}
                      </Text>
                    </Text>
                  </View>
                </View>
              </AdaptiveGlassView>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error || "#FF3B30"} />
          <Text style={[styles.signOutText, { color: colors.error || "#FF3B30" }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  // Photo Section
  photoSection: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: "relative",
    overflow: "visible", // Allow edit button to extend beyond bounds
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
    height: PHOTO_HEIGHT * 0.5,
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
  navButtonGlass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonFallback: {
    backgroundColor: "rgba(0,0,0,0.4)",
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
    bottom: -32, // Half of button height to overlap below photo section
    right: 24,
    zIndex: 10,
    // Outer glow for visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  editButtonGlass: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  editButtonFallback: {
    shadowColor: "#FF4458",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  // Photo Gallery
  photoGallerySection: {
    marginTop: 16,
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
  // Bio Section
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
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  // Interests Section
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  interestChipOutline: {
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "transparent",
  },
  interestText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // Looking For Section
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  lookingForDetails: {
    flex: 1,
  },
  lookingForLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  lookingForValue: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  bottomPadding: {
    height: 40,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
