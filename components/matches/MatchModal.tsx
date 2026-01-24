import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect } from "react";
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Doc } from "@/convex/_generated/dataModel";
import { SCREEN_WIDTH } from "@/lib/constants";
import { hapticMatch } from "@/lib/haptics";
import { AppColors, useAppTheme } from "@/lib/theme";

interface MatchModalProps {
  visible: boolean;
  currentUser: Doc<"users"> | null;
  matchedUser: Doc<"users"> | null;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

export function MatchModal({
  visible,
  currentUser,
  matchedUser,
  onSendMessage,
  onKeepSwiping,
}: MatchModalProps) {
  const { colors } = useAppTheme();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const heartScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      hapticMatch();
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      heartScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, { damping: 8 }),
          withSpring(1, { damping: 10 })
        )
      );
    } else {
      opacity.value = 0;
      scale.value = 0;
      heartScale.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!matchedUser || !currentUser) return null;

  const currentUserImage =
    currentUser.photos?.[0] ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser.name}`;
  const matchedUserImage =
    matchedUser.photos?.[0] ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${matchedUser.name}`;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, containerStyle]}>
        <BlurView intensity={80} style={styles.blur} tint="dark">
          <Animated.View style={[styles.content, contentStyle]}>
            {/* Match text */}
            <Text style={styles.matchText}>It's a Match!</Text>
            <Text style={styles.subText}>
              You and {matchedUser.name} liked each other
            </Text>

            {/* Profile images */}
            <View style={styles.profiles}>
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: currentUserImage }}
                  style={styles.profileImage}
                />
              </View>

              <Animated.View style={[styles.heartContainer, heartStyle]}>
                <Ionicons name="heart" size={32} color={AppColors.match} />
              </Animated.View>

              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: matchedUserImage }}
                  style={styles.profileImage}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onSendMessage}
              >
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                  Send a Message
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onKeepSwiping}
              >
                <Text
                  style={[styles.buttonText, { color: colors.onBackground }]}
                >
                  Keep Swiping
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  blur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  matchText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 32,
    textAlign: "center",
  },
  profiles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  profileContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  heartContainer: {
    marginHorizontal: -20,
    zIndex: 10,
    backgroundColor: "#fff",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
