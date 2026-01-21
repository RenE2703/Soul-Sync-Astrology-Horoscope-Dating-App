import { GlassView } from "expo-glass-effect";
import React from "react";
import { Platform, StyleProp, View, ViewProps, ViewStyle } from "react-native";

import { useAppTheme } from "@/lib/theme";

/**
 * Glass effect support detection for iOS 26+
 *
 * The expo-glass-effect GlassView component only works on iOS 26+.
 * Use this constant to conditionally render glass effects with fallbacks.
 *
 * @example
 * ```tsx
 * import { supportsGlassEffect } from "@/lib/glass";
 *
 * if (supportsGlassEffect) {
 *   return <GlassView style={styles.container}>...</GlassView>;
 * }
 * return <View style={[styles.container, styles.fallback]}>...</View>;
 * ```
 */
export const supportsGlassEffect =
  Platform.OS === "ios" && parseInt(Platform.Version as string, 10) >= 26;

/**
 * Common fallback styles for non-glass UI elements
 */
export const glassFallbackStyles = {
  /** Standard rounded button/container fallback */
  button: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  /** Card or chip fallback with subtle border */
  card: {
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
  },
  /** Elevated fallback with shadow */
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/**
 * Props for AdaptiveGlassView component
 */
interface AdaptiveGlassViewProps extends ViewProps {
  children: React.ReactNode;
  /** Glass effect style - defaults to "regular" */
  glassEffectStyle?: "regular" | "prominent";
  /** Tint color for the glass effect */
  tintColor?: string;
  /** Background color to use when glass effect is not supported */
  fallbackColor?: string;
  /** Additional styles to apply only to the fallback View */
  fallbackStyle?: StyleProp<ViewStyle>;
  /** Whether the glass view is interactive */
  isInteractive?: boolean;
}

/**
 * Adaptive glass view that renders GlassView on iOS 26+ and falls back to
 * a regular View with background color on other platforms.
 *
 * @example
 * ```tsx
 * <AdaptiveGlassView style={styles.card}>
 *   <Text>Content</Text>
 * </AdaptiveGlassView>
 *
 * // With custom fallback color
 * <AdaptiveGlassView
 *   style={styles.badge}
 *   fallbackColor="rgba(0,0,0,0.4)"
 * >
 *   <Icon name="chevron" />
 * </AdaptiveGlassView>
 * ```
 */
export function AdaptiveGlassView({
  children,
  style,
  glassEffectStyle = "regular",
  tintColor,
  fallbackColor,
  fallbackStyle,
  isInteractive,
  ...props
}: AdaptiveGlassViewProps) {
  const { colors } = useAppTheme();

  if (supportsGlassEffect) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        style,
        { backgroundColor: fallbackColor ?? colors.surfaceVariant },
        fallbackStyle,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Re-export GlassView for convenience
export { GlassView } from "expo-glass-effect";
