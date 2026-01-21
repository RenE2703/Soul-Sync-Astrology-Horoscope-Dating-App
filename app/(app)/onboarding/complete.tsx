import { useUser } from "@clerk/clerk-expo";
import { useAction } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import { hapticSuccess } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

export default function CompleteScreen() {
  const params = useLocalSearchParams();
  const { user } = useUser();
  const { colors } = useAppTheme();

  const [status, setStatus] = useState<"creating" | "generating" | "done" | "error">("creating");
  const [error, setError] = useState<string | null>(null);

  const createProfile = useAction(api.users.createProfileWithEmbedding);

  // Pulse animation for the loading indicator
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    const createUserProfile = async () => {
      if (!user) return;

      try {
        setStatus("creating");

        const firstName = params.firstName as string;
        const lastName = params.lastName as string;
        const age = parseInt(params.age as string, 10);
        const gender = params.gender as string;
        const bio = params.bio as string;
        const interests = JSON.parse(params.interests as string) as string[];
        const lookingFor = JSON.parse(params.lookingFor as string) as string[];
        const ageRangeMin = parseInt(params.ageRangeMin as string, 10);
        const ageRangeMax = parseInt(params.ageRangeMax as string, 10);
        const photos = JSON.parse(params.photos as string) as string[];

        setStatus("generating");

        await createProfile({
          clerkId: user.id,
          name: `${firstName} ${lastName}`,
          age,
          gender: gender.toLowerCase(),
          bio,
          lookingFor,
          ageRange: { min: ageRangeMin, max: ageRangeMax },
          interests,
          photos,
        });

        setStatus("done");
        hapticSuccess();
        // Protected route will automatically redirect to (tabs) when profile exists
      } catch (err) {
        console.error("Error creating profile:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      }
    };

    createUserProfile();
  }, [user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {status === "done" ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.successContainer}>
            <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={styles.successEmoji}>
              🎉
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(500)}
              style={[styles.successTitle, { color: colors.onBackground }]}
            >
              You're all set!
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(300).duration(500)}
              style={[styles.successSubtitle, { color: colors.onSurfaceVariant }]}
            >
              Get ready to find your perfect match
            </Animated.Text>
          </Animated.View>
        ) : status === "error" ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😔</Text>
            <Text style={[styles.errorTitle, { color: colors.error }]}>
              Oops, something went wrong
            </Text>
            <Text style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
              {error}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(500)} style={styles.loadingContainer}>
            <Animated.View style={[styles.pulseContainer, pulseStyle]}>
              <View style={[styles.loadingCircle, { backgroundColor: colors.primaryContainer }]}>
                <Text style={styles.loadingEmoji}>
                  {status === "creating" ? "📝" : "✨"}
                </Text>
              </View>
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.delay(200).duration(500)}
              style={[styles.loadingTitle, { color: colors.onBackground }]}
            >
              {status === "creating" ? "Creating your profile..." : "Generating AI magic..."}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(300).duration(500)}
              style={[styles.loadingSubtitle, { color: colors.onSurfaceVariant }]}
            >
              {status === "creating"
                ? "Setting up your account"
                : "Building your match profile with AI"}
            </Animated.Text>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.spinner}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successContainer: {
    alignItems: "center",
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
  errorContainer: {
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: "center",
  },
  pulseContainer: {
    marginBottom: 32,
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingEmoji: {
    fontSize: 48,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  loadingSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});
