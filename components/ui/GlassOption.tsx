import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassOptionProps {
  icon: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
}

export function GlassOption({ icon, label, onPress, selected = false }: GlassOptionProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  const content = (
    <>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (supportsGlassEffect) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <GlassView
          style={[styles.option, selected && { borderColor: colors.primary, borderWidth: 2 }]}
          glassEffectStyle="regular"
          isInteractive
        >
          {content}
        </GlassView>
      </TouchableOpacity>
    );
  }

  // Fallback for non-iOS 26
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View
        style={[
          styles.option,
          styles.fallback,
          { backgroundColor: colors.surfaceVariant, borderColor: selected ? colors.primary : colors.outline },
        ]}
      >
        {content}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    gap: 16,
  },
  fallback: {
    borderWidth: 2,
  },
  icon: {
    fontSize: 36,
    color: "#000000",
  },
  label: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
});
