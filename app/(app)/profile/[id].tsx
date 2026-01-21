import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { GlassView } from "expo-glass-effect";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { hapticButtonPress, hapticLike, hapticReject } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProfileViewScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const profileId = id as Id<"users">;

  // Get current user
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get profile being viewed
  const profile = useQuery(api.users.get, profileId ? { id: profileId } : "skip");

  // Swipe mutation
  const createSwipe = useMutation(api.swipes.createSwipe);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleLike = async () => {
    if (!currentUser?._id || !profile?._id) return;

    hapticLike();
    try {
      const result = await createSwipe({
        swiperId: currentUser._id,
        swipedId: profile._id,
        action: "like",
      });

      if (result.matched) {
        // Show match modal or navigate
      }
      router.back();
    } catch (error) {
      console.error("Failed to like:", error);
    }
  };

  const handleReject = async () => {
    if (!currentUser?._id || !profile?._id) return;

    hapticReject();
    try {
      await createSwipe({
        swiperId: currentUser._id,
        swipedId: profile._id,
        action: "reject",
      });
      router.back();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.onBackground }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photos = profile.photos?.length
    ? profile.photos
    : [`https://api.dicebear.com/7.x/avataaars/png?seed=${profile.name}`];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Gallery */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: photos[currentPhotoIndex] }}
              style={styles.mainPhoto}
            />

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                hapticButtonPress();
                router.back();
              }}
            >
              <GlassView style={styles.closeButtonGlass} glassEffectStyle="regular">
                <Ionicons name="close" size={24} color="#fff" />
              </GlassView>
            </TouchableOpacity>

            {/* Photo indicators */}
            {photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {photos.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentPhotoIndex && styles.activeIndicator,
                    ]}
                    onPress={() => setCurrentPhotoIndex(index)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.onBackground }]}>
                {profile.name}
              </Text>
              <Text style={[styles.age, { color: colors.onSurfaceVariant }]}>
                {profile.age}
              </Text>
            </View>

            <Text style={[styles.bio, { color: colors.onSurfaceVariant }]}>
              {profile.bio}
            </Text>

            {/* Interests */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                Interests
              </Text>
              <View style={styles.interests}>
                {profile.interests?.map((interest, index) => (
                  <View
                    key={index}
                    style={[
                      styles.interestTag,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        { color: colors.onPrimaryContainer },
                      ]}
                    >
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Looking For */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                Looking for
              </Text>
              <Text style={[styles.lookingFor, { color: colors.onSurfaceVariant }]}>
                {profile.lookingFor?.join(", ")}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <GlassView style={styles.actionBar} glassEffectStyle="regular">
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
          >
            <Ionicons name="close" size={32} color={colors.reject} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLike}
          >
            <Ionicons name="heart" size={32} color={colors.like} />
          </TouchableOpacity>
        </GlassView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
    position: "relative",
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  closeButtonGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  photoIndicators: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
  },
  activeIndicator: {
    backgroundColor: "#fff",
  },
  profileInfo: {
    padding: 20,
    paddingBottom: 120,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: "700",
  },
  age: {
    fontSize: 28,
    fontWeight: "500",
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
  },
  lookingFor: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  rejectButton: {
    borderWidth: 2,
    borderColor: "#FF3B30",
  },
  likeButton: {
    borderWidth: 2,
    borderColor: "#4CD964",
  },
});
