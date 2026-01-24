import { StyleSheet, ViewStyle } from "react-native";

/**
 * Shared shadow style definitions.
 * Use these instead of defining shadows inline for consistency.
 */

/** Small shadow for subtle elevation */
export const shadowSmall: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
};

/** Medium shadow for cards and buttons */
export const shadowMedium: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
};

/** Large shadow for modals and overlays */
export const shadowLarge: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2,
  shadowRadius: 16,
  elevation: 8,
};

/** Primary accent shadow for CTA buttons */
export const shadowPrimary: ViewStyle = {
  shadowColor: "#FF4458",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
};

/** Shadow styles object for use with StyleSheet.compose */
export const shadows = {
  small: shadowSmall,
  medium: shadowMedium,
  large: shadowLarge,
  primary: shadowPrimary,
} as const;

/** Pre-composed StyleSheet for direct use */
export const shadowStyles = StyleSheet.create({
  small: shadowSmall,
  medium: shadowMedium,
  large: shadowLarge,
  primary: shadowPrimary,
});
