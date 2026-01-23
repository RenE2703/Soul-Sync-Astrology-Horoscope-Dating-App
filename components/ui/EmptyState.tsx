import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle: string;
  /** Optional custom icon color (defaults to primary) */
  iconColor?: string;
  /** Optional additional content below subtitle (e.g., countdown timer) */
  children?: React.ReactNode;
}

/**
 * A reusable empty state component with consistent styling.
 * Used for "no data" states like no profiles, no matches, no messages.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="people-outline"
 *   title="No more profiles"
 *   subtitle="Check back later for new matches"
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  subtitle,
  iconColor,
  children,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
        <Ionicons
          name={icon}
          size={40}
          color={iconColor ?? colors.primary}
        />
      </View>
      <Text style={[styles.title, { color: colors.onBackground }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        {subtitle}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
});
