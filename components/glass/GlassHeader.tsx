import { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

interface GlassHeaderProps {
  /** Main title text */
  title?: string;
  /** Subtitle text or custom ReactNode */
  subtitle?: ReactNode;
  /** Content to render on the left side (e.g., back button) */
  leftContent?: ReactNode;
  /** Content to render on the right side (e.g., timer, action button) */
  rightContent?: ReactNode;
  /** Custom children to render instead of title/subtitle */
  children?: ReactNode;
  /** Additional styles for the header container */
  style?: ViewStyle;
  /** Whether to center the title (useful when leftContent is provided) */
  centerTitle?: boolean;
}

/**
 * A reusable glass-effect header component that handles:
 * - Safe area insets
 * - GlassView with fallback for non-supporting devices
 * - Flexible layout with left/center/right content areas
 * 
 * For the glass effect to work properly, content should scroll BEHIND
 * this header. Use `contentContainerStyle={{ paddingTop: headerHeight }}`
 * on your ScrollView/FlatList where headerHeight accounts for the header.
 * 
 * @example
 * // Simple title header
 * <GlassHeader title="Today's Picks" subtitle="Refreshed daily" />
 * 
 * @example
 * // Header with left button and centered title
 * <GlassHeader
 *   leftContent={<CloseButton onPress={handleClose} />}
 *   title="Edit Profile"
 *   centerTitle
 * />
 * 
 * @example
 * // Header with right content
 * <GlassHeader
 *   title="Today's Picks"
 *   subtitle={<View style={{ flexDirection: 'row' }}><Icon /><Text>Refreshed</Text></View>}
 *   rightContent={<TimerBadge countdown="8h 44m" />}
 * />
 */
export function GlassHeader({
  title,
  subtitle,
  leftContent,
  rightContent,
  children,
  style,
  centerTitle = false,
}: GlassHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const renderContent = () => {
    if (children) {
      return children;
    }

    // Centered layout (for modals/edit screens)
    if (centerTitle) {
      return (
        <View style={styles.contentCentered}>
          <View style={styles.sideSection}>{leftContent}</View>
          <View style={styles.centerSection}>
            {title && (
              <Text style={[styles.titleCentered, { color: colors.onBackground }]}>
                {title}
              </Text>
            )}
          </View>
          <View style={styles.sideSection}>{rightContent}</View>
        </View>
      );
    }

    // Default layout (title on left, optional right content)
    return (
      <View style={styles.content}>
        <View style={styles.mainSection}>
          {title && (
            <Text style={[styles.title, { color: colors.onBackground }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            typeof subtitle === "string" ? (
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                {subtitle}
              </Text>
            ) : (
              <View style={styles.subtitleContainer}>{subtitle}</View>
            )
          )}
        </View>
        {rightContent && <View style={styles.rightSection}>{rightContent}</View>}
      </View>
    );
  };

  const headerStyle = [styles.header, { paddingTop: insets.top + 12 }, style];

  if (supportsGlassEffect) {
    return (
      <GlassView style={headerStyle} glassEffectStyle="regular">
        {renderContent()}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        ...headerStyle,
        styles.headerFallback,
        { backgroundColor: colors.background },
      ]}
    >
      {renderContent()}
    </View>
  );
}

/**
 * Calculate the header height for content inset.
 * Use this to set paddingTop on your scrollable content.
 * 
 * @param insetTop - Safe area top inset (from useSafeAreaInsets)
 * @param hasSubtitle - Whether the header has a subtitle
 * @returns The calculated header height
 */
export function getGlassHeaderHeight(insetTop: number, hasSubtitle = true): number {
  // top inset + top padding + title height + subtitle height + bottom padding
  const baseHeight = insetTop + 12 + 34; // inset + padding + title
  const subtitleHeight = hasSubtitle ? 22 : 0;
  const bottomPadding = 16;
  return baseHeight + subtitleHeight + bottomPadding;
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerFallback: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  // Default layout (title left, content right)
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mainSection: {
    flex: 1,
  },
  rightSection: {
    minWidth: 44,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  subtitleContainer: {
    marginTop: 4,
  },
  // Centered layout (left button, centered title, right button)
  contentCentered: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideSection: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  titleCentered: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
