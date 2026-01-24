import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassNavButton } from "@/components/glass";
import { PhotoIndicators, PhotoTapZones } from "@/components/ui";
import { Doc } from "@/convex/_generated/dataModel";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/lib/constants";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.55;

interface ProfileViewProps {
  user: Doc<"users">;
  distance?: number | null; // Distance in miles (optional)
}

export function ProfileView({ user, distance }: ProfileViewProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = user.photos?.length ? user.photos : ["https://via.placeholder.com/400x500"];
  const currentPhoto = photos[currentPhotoIndex];


  const handlePhotoTap = (side: "left" | "right") => {
    if (side === "right") {
      setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length);
    } else if (side === "left") {
      setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo Section */}
      <View style={styles.photoSection}>
        <Image source={{ uri: currentPhoto }} style={styles.photo} />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gradient}
        />

        {/* Photo Navigation Indicators */}
        <PhotoIndicators
          count={photos.length}
          currentIndex={currentPhotoIndex}
          style={{ top: insets.top + 12 }}
        />

        {/* Tap Zones for Photo Navigation */}
        <PhotoTapZones onTap={handlePhotoTap} />

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
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.age}>{user.age}</Text>
          </View>
          <View style={styles.infoRow}>
            {user.gender && (
              <View style={styles.genderRow}>
                <Text style={styles.genderIcon}>
                  {user.gender === "woman" ? "♀" : "♂"}
                </Text>
                <Text style={styles.genderText}>{user.gender}</Text>
              </View>
            )}
            {distance !== undefined && distance !== null && (
              <View style={styles.distanceRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.distanceText}>
                  {distance < 1 ? "< 1" : Math.round(distance)} mi
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Photo Gallery - Right below main photo for easy access */}
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
                <Image source={{ uri: photo }} style={styles.galleryPhoto} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content Section - Modern Design */}
      <View style={styles.contentSection}>
        {/* Bio */}
        {user.bio && (
          <View style={styles.bioSection}>
            <Text style={[styles.bioQuote, { color: colors.primary }]}>&ldquo;</Text>
            <Text style={[styles.bioText, { color: colors.onBackground }]}>
              {user.bio}
            </Text>
          </View>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.interestsSection}>
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
              INTERESTS
            </Text>
            <View style={styles.interestsGrid}>
              {user.interests.map((interest, index) => (
                <AdaptiveGlassView 
                  key={`${interest}-${index}`}
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

        {/* Looking For - Elegant card */}
        {user.lookingFor && user.lookingFor.length > 0 && (
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
                    {user.lookingFor.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(" & ")}
                    {" · "}
                    <Text style={{ fontWeight: "400", opacity: 0.7 }}>
                      {user.ageRange?.min || 18}-{user.ageRange?.max || 99}
                    </Text>
                  </Text>
                </View>
              </View>
            </AdaptiveGlassView>
          </View>
        )}
      </View>

      {/* Bottom padding for floating buttons + tab bar */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 180,
  },
  photoSection: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: "relative",
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
  nameOverlay: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.85,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
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
  // Modern Content Section
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
});
