import { StyleSheet, TouchableOpacity, View } from "react-native";

interface PhotoTapZonesProps {
  /** Callback when a side is tapped */
  onTap: (side: "left" | "right") => void;
}

/**
 * Invisible tap zones for photo navigation.
 * Left half goes to previous, right half goes to next.
 */
export function PhotoTapZones({ onTap }: PhotoTapZonesProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.zone}
        onPress={() => onTap("left")}
        activeOpacity={1}
      />
      <TouchableOpacity
        style={styles.zone}
        onPress={() => onTap("right")}
        activeOpacity={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
  },
  zone: {
    flex: 1,
  },
});
