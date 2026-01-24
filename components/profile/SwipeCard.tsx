import { useCallback } from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Doc } from "@/convex/_generated/dataModel";
import { ROTATION_ANGLE, SCREEN_HEIGHT, SCREEN_WIDTH, SWIPE_THRESHOLD } from "@/lib/constants";
import { hapticLike, hapticReject, hapticSwipe } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface SwipeCardProps {
  user: Doc<"users">;
  onSwipe: (direction: "left" | "right") => void;
  onPress?: () => void;
  isFirst?: boolean;
}

export function SwipeCard({
  user,
  onSwipe,
  onPress,
  isFirst = false,
}: SwipeCardProps) {
  const { colors } = useAppTheme();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isFirst ? 1 : 0.95);

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        hapticLike();
      } else {
        hapticReject();
      }
      onSwipe(direction);
    },
    [onSwipe]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Haptic feedback at threshold
      if (
        Math.abs(event.translationX) > SWIPE_THRESHOLD * 0.8 &&
        Math.abs(event.translationX) < SWIPE_THRESHOLD * 0.85
      ) {
        scheduleOnRN(hapticSwipe);
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe completed
        const direction = event.translationX > 0 ? "right" : "left";
        translateX.value = withTiming(
          direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            scheduleOnRN(handleSwipeComplete, direction);
          }
        );
        translateY.value = withTiming(event.translationY * 2, { duration: 300 });
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
        { scale: scale.value },
      ],
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  // Default placeholder image if no photos
  const imageUri =
    user.photos?.[0] ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${user.name}`;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Pressable style={styles.cardInner} onPress={onPress}>
          <Image source={{ uri: imageUri }} style={styles.image} />

          {/* Gradient overlay */}
          <View style={styles.gradientOverlay} />

          {/* Like stamp */}
          <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacityStyle]}>
            <Text style={styles.stampText}>LIKE</Text>
          </Animated.View>

          {/* Nope stamp */}
          <Animated.View style={[styles.stamp, styles.nopeStamp, nopeOpacityStyle]}>
            <Text style={styles.stampText}>NOPE</Text>
          </Animated.View>

          {/* User info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.age}>{user.age}</Text>
            </View>
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
            <View style={styles.interests}>
              {user.interests?.slice(0, 3).map((interest, index) => (
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
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardInner: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "transparent",
    backgroundImage:
      "linear-gradient(transparent, rgba(0,0,0,0.8))",
  },
  stamp: {
    position: "absolute",
    top: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 4,
    borderRadius: 8,
    transform: [{ rotate: "-20deg" }],
  },
  likeStamp: {
    left: 20,
    borderColor: "#4CD964",
  },
  nopeStamp: {
    right: 20,
    borderColor: "#FF3B30",
    transform: [{ rotate: "20deg" }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  userInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  age: {
    fontSize: 24,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  bio: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 12,
    lineHeight: 20,
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
