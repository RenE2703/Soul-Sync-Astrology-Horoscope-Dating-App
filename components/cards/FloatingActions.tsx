import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress, hapticReject } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface FloatingActionsProps {
  onReject: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function FloatingActions({ onReject, onLike, disabled = false }: FloatingActionsProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Account for tab bar height (typically ~49) + safe area + some padding
  const tabBarHeight = 49;
  const bottomOffset = insets.bottom + tabBarHeight + 20;

  const handleReject = () => {
    if (disabled) return;
    hapticReject();
    onReject();
  };

  const handleLike = () => {
    if (disabled) return;
    hapticButtonPress();
    onLike();
  };

  const RejectButton = () => {
    if (supportsGlassEffect) {
      return (
        <TouchableOpacity
          onPress={handleReject}
          disabled={disabled}
          activeOpacity={0.9}
          style={styles.buttonWrapper}
        >
          <GlassView style={styles.rejectButton} glassEffectStyle="regular" isInteractive>
            <Ionicons name="close" size={36} color={colors.primary} />
          </GlassView>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleReject}
        disabled={disabled}
        activeOpacity={0.9}
        style={styles.buttonWrapper}
      >
        <View style={[styles.rejectButton, styles.fallbackReject, { borderColor: colors.primary + "33" }]}>
          <Ionicons name="close" size={36} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const LikeButton = () => {
    if (supportsGlassEffect) {
      return (
        <TouchableOpacity
          onPress={handleLike}
          disabled={disabled}
          activeOpacity={0.9}
          style={styles.buttonWrapper}
        >
          <GlassView
            style={styles.likeButton}
            glassEffectStyle="regular"
            isInteractive
            tintColor={colors.primary}
          >
            <Ionicons name="heart" size={36} color="#FFFFFF" />
          </GlassView>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleLike}
        disabled={disabled}
        activeOpacity={0.9}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={[colors.primary, "#FF4458"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.likeButton, styles.fallbackLike]}
        >
          <Ionicons name="heart" size={36} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <RejectButton />
      <LikeButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  buttonWrapper: {
    // Outer glow effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  rejectButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackReject: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 2,
  },
  fallbackLike: {
    shadowColor: "#FF4458",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
