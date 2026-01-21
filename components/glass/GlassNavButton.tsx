import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

import { AdaptiveGlassView } from "@/lib/glass";

interface GlassNavButtonProps {
  direction: "left" | "right";
  onPress: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
}

/**
 * A circular navigation button with glass effect for photo galleries.
 * Used for navigating between photos in profile views.
 *
 * @example
 * ```tsx
 * <GlassNavButton
 *   direction="left"
 *   onPress={() => handlePhotoTap("left")}
 * />
 * ```
 */
export function GlassNavButton({
  direction,
  onPress,
  size = 36,
  iconSize = 18,
  iconColor = "#FFFFFF",
}: GlassNavButtonProps) {
  const iconName = direction === "left" ? "chevron-back" : "chevron-forward";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <AdaptiveGlassView
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        glassEffectStyle="regular"
        fallbackColor="rgba(0,0,0,0.4)"
      >
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </AdaptiveGlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
});
