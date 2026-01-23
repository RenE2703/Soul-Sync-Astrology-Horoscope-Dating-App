import { StyleSheet, View, ViewStyle } from "react-native";

interface PhotoIndicatorsProps {
  /** Total number of photos */
  count: number;
  /** Currently displayed photo index (0-based) */
  currentIndex: number;
  /** Additional styles for the container */
  style?: ViewStyle;
}

/**
 * Horizontal bar indicators showing the current photo position.
 * Used in photo carousels and profile views.
 */
export function PhotoIndicators({
  count,
  currentIndex,
  style,
}: PhotoIndicatorsProps) {
  if (count <= 1) return null;

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              backgroundColor:
                index === currentIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});
