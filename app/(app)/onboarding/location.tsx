import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton } from "@/components/glass";
import { DistanceSlider, DISTANCE_STEPS } from "@/components/preferences";
import { HeaderIcon } from "@/components/ui";
import { AdaptiveGlassView } from "@/lib/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { requestAndGetLocation, type LocationInfo } from "@/lib/location";
import { useAppTheme } from "@/lib/theme";

export default function LocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  // Store slider position (0-4), default to 25 miles (index 1)
  const [distanceIndex, setDistanceIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  const maxDistance = DISTANCE_STEPS[distanceIndex];

  const handleEnableLocation = async () => {
    hapticButtonPress();
    setIsLoading(true);

    try {
      const result = await requestAndGetLocation();

      if (result.location) {
        setLocationGranted(true);
        setLocationCoords(result.location);
        setLocationInfo(result.locationInfo);
      }
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    hapticButtonPress();
    router.push({
      pathname: "/(app)/onboarding/bio",
      params: {
        ...params,
        // Only pass maxDistance if it's not unlimited
        ...(maxDistance !== undefined && { maxDistance: maxDistance.toString() }),
        ...(locationCoords && {
          latitude: locationCoords.latitude.toString(),
          longitude: locationCoords.longitude.toString(),
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
        // Only pass maxDistance if it's not unlimited
        ...(maxDistance !== undefined && { maxDistance: maxDistance.toString() }),
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
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
            fallbackColor={locationGranted ? colors.primaryContainer : colors.surfaceVariant}
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
                {locationGranted
                  ? "Location enabled"
                  : "Location not yet enabled"}
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
            </View>
          </AdaptiveGlassView>

          {/* Enable Location Button */}
          {!locationGranted && (
            <TouchableOpacity
              style={[
                styles.enableButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleEnableLocation}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.enableButtonText}>
                {isLoading ? "Getting location..." : "Enable Location"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Distance Slider */}
          <View style={styles.sliderSection}>
            <DistanceSlider value={distanceIndex} onChange={setDistanceIndex} />
          </View>
        </Animated.View>
      </View>

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
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  questionContainer: { marginBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 17, lineHeight: 24 },
  locationContainer: { gap: 24 },
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
});
