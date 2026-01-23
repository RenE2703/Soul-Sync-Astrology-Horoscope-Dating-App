import { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassIconButtonProps {
  /** The icon content to display inside the button */
  icon: ReactNode;
  /** Handler called when the button is pressed */
  onPress: () => void;
  /** Size of the button in pixels (default: 44) */
  size?: number;
}

/**
 * A circular glass-effect button that displays an icon.
 * Used as the base component for GlassBackButton and GlassCloseButton.
 */
export function GlassIconButton({
  icon,
  onPress,
  size = 44,
}: GlassIconButtonProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    hapticButtonPress();
    onPress();
  };

  const buttonStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (supportsGlassEffect) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <GlassView
          style={[styles.button, buttonStyle]}
          glassEffectStyle="regular"
          isInteractive
        >
          {icon}
        </GlassView>
      </TouchableOpacity>
    );
  }

  // Fallback for non-iOS 26
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View
        style={[
          styles.button,
          styles.fallback,
          buttonStyle,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        {icon}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  fallback: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
