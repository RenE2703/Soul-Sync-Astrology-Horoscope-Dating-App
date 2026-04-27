import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useColorScheme } from "react-native";

// SoulSync app primary color - Tinder Pink
export const SEED_COLOR = "#fd297b";

// Custom color palette for the dating app
export const AppColors = {
  primary: "#fd297b", // Tinder Pink
  secondary: "#2D3142", // Mystic dark
  accent: "#ff655b", // Tinder Orange
  like: "#4CD964",
  reject: "#FF3B30",
  match: "#a652ba", // Purple for matches/super likes
  background: {
    light: "#FFFFFF",
    dark: "#000000",
  },
  surface: {
    light: "#F8F9FA",
    dark: "#1C1C1E",
  },
  text: {
    light: "#000000",
    dark: "#FFFFFF",
  },
  textSecondary: {
    light: "#6C757D",
    dark: "#8E8E93",
  },
};

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme({ sourceColor: SEED_COLOR });

  const isDark = colorScheme === "dark";

  return {
    isDark,
    theme,
    colors: {
      // Material 3 colors
      primary: isDark ? theme.dark.primary : theme.light.primary,
      onPrimary: isDark ? theme.dark.onPrimary : theme.light.onPrimary,
      primaryContainer: isDark
        ? theme.dark.primaryContainer
        : theme.light.primaryContainer,
      onPrimaryContainer: isDark
        ? theme.dark.onPrimaryContainer
        : theme.light.onPrimaryContainer,
      secondary: isDark ? theme.dark.secondary : theme.light.secondary,
      onSecondary: isDark ? theme.dark.onSecondary : theme.light.onSecondary,
      background: isDark ? theme.dark.background : theme.light.background,
      onBackground: isDark ? theme.dark.onBackground : theme.light.onBackground,
      surface: isDark ? theme.dark.surface : theme.light.surface,
      onSurface: isDark ? theme.dark.onSurface : theme.light.onSurface,
      surfaceVariant: isDark
        ? theme.dark.surfaceVariant
        : theme.light.surfaceVariant,
      onSurfaceVariant: isDark
        ? theme.dark.onSurfaceVariant
        : theme.light.onSurfaceVariant,
      outline: isDark ? theme.dark.outline : theme.light.outline,
      error: isDark ? theme.dark.error : theme.light.error,

      // Custom app colors
      like: AppColors.like,
      reject: AppColors.reject,
      match: AppColors.match,
      accent: AppColors.accent,
    },
  };
}

// Theme context type for consistency
export type AppTheme = ReturnType<typeof useAppTheme>;
