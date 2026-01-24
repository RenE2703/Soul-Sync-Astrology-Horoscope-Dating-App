import { StyleSheet, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { HeaderIcon } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

interface QuestionHeaderProps {
  /** Ionicons icon name (mutually exclusive with emoji) */
  icon?: string;
  /** Emoji character (mutually exclusive with icon) */
  emoji?: string;
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle: string;
  /** Animation delay in milliseconds (default: 100) */
  delay?: number;
  /** Bottom margin style variant */
  marginBottom?: number;
}

/**
 * Animated header component for onboarding screens.
 * Displays an icon/emoji with title and subtitle with fade-in animation.
 */
export function QuestionHeader({
  icon,
  emoji,
  title,
  subtitle,
  delay = 100,
  marginBottom = 40,
}: QuestionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={[styles.container, { marginBottom }]}
    >
      {icon && <HeaderIcon icon={icon} />}
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.title, { color: colors.onBackground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        {subtitle}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
  },
});
