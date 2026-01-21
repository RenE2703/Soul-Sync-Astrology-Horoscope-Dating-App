import { StyleProp, ViewStyle } from "react-native";

import { AdaptiveGlassView } from "@/lib/glass";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tint color for the glass effect */
  tintColor?: string;
  /** Background color to use when glass effect is not supported */
  fallbackColor?: string;
}

/**
 * A card component that uses glass effect on iOS 26+ and falls back to
 * a solid background on other platforms.
 *
 * Use for containers, badges, cards, and other surface elements.
 *
 * @example
 * ```tsx
 * <GlassCard style={styles.badge}>
 *   <Icon name="time" />
 *   <Text>New picks in 2h</Text>
 * </GlassCard>
 * ```
 */
export function GlassCard({
  children,
  style,
  tintColor,
  fallbackColor,
}: GlassCardProps) {
  return (
    <AdaptiveGlassView
      style={style}
      glassEffectStyle="regular"
      tintColor={tintColor}
      fallbackColor={fallbackColor}
    >
      {children}
    </AdaptiveGlassView>
  );
}
