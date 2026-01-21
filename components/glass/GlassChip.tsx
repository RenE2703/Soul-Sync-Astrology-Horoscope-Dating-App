import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { AdaptiveGlassView } from "@/lib/glass";
import { hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassChipProps {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function GlassChip({ emoji, label, selected, onPress }: GlassChipProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <AdaptiveGlassView
        style={styles.chip}
        isInteractive
        tintColor={selected ? colors.primary : undefined}
        fallbackColor={selected ? colors.primary : colors.surfaceVariant}
        fallbackStyle={[
          styles.fallback,
          { borderColor: selected ? colors.primary : colors.outline },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, { color: selected ? "#FFFFFF" : colors.onSurfaceVariant }]}>
          {label}
        </Text>
      </AdaptiveGlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  fallback: {
    borderWidth: 2,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
