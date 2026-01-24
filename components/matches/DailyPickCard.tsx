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

interface DailyPickCardProps {
  user: Doc<"users">;
  matchScore: number;
  aiExplanation: string;
  sharedInterests: string[];
  onLike: () => void;
  isProcessing?: boolean;
}

export function DailyPickCard({
  user,
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

  // Header height for content inset (so content scrolls behind glass header)
  const headerHeight = insets.top + 12 + 60 + 16; // top inset + padding + title height + bottom padding

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

            {/* Photo indicators */}
            <PhotoIndicators
              count={photos.length}
              currentIndex={currentPhotoIndex}
              style={{ top: 12 }}
            />

            {/* Tap zones */}
            <PhotoTapZones onTap={handlePhotoTap} />

            {/* Gradient overlay */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.photoGradient}
            />

            {/* Name overlay on photo */}
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{user.name}, {user.age}</Text>
              {user.gender && (
                <Text style={styles.gender}>
                  {user.gender === "woman" ? "♀" : "♂"} {user.gender}
                </Text>
              )}
            </View>
          </View>

          {/* AI Insight Section - Prominent */}
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
                
                {/* Like Button */}
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

        {/* Bio Section */}
        {user.bio && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              ABOUT
            </Text>
            <Text style={[styles.bio, { color: colors.onBackground }]}>
              {user.bio}
            </Text>
          </View>
        )}

        {/* All Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              INTERESTS
            </Text>
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
                    {isShared && (
                      <Ionicons name="heart" size={12} color={colors.primary} />
                    )}
                    <Text
                      style={[
                        styles.interestText,
                        { color: isShared ? colors.primary : colors.onSurfaceVariant },
                      ]}
                    >
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
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              LOOKING FOR
            </Text>
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

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
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
  scrollContent: {
    padding: 16,
    gap: 12,
  },
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
  photo: {
    width: "100%",
    height: "100%",
  },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  nameContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gender: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textTransform: "capitalize",
  },
  insightSection: {
    padding: 20,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchPercentage: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  aiExplanation: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  sharedSection: {
    marginTop: 16,
  },
  sharedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sharedContent: {
    flex: 1,
  },
  sharedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sharedLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sharedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sharedChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sharedChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  noSharedText: {
    fontSize: 15,
    fontWeight: "500",
  },
  likeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  section: {
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
  },
  lookingForRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lookingForText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
