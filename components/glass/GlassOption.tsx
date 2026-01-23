import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticSelection } from "@/lib/haptics";
import { AppColors, useAppTheme } from "@/lib/theme";

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
      <Text style={[styles.label, { color: colors.onBackground }]}>{label}</Text>
      {selected && (
        <View style={[styles.checkmark, { backgroundColor: AppColors.primary }]}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </>
  );

  if (supportsGlassEffect) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <GlassView
          style={[
            styles.option,
            selected && { borderColor: AppColors.primary, borderWidth: 2.5 },
          ]}
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
          {
            backgroundColor: selected ? AppColors.primary + "15" : colors.surfaceVariant,
            borderColor: selected ? AppColors.primary : colors.outline,
            borderWidth: selected ? 2.5 : 1.5,
          },
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
    // borderWidth set dynamically
  },
  icon: {
    fontSize: 36,
  },
  label: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
