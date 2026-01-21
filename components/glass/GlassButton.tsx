import { Pressable, StyleSheet, Text } from "react-native";

import { AdaptiveGlassView } from "@/lib/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
}

export function GlassButton({ onPress, label, disabled = false }: GlassButtonProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    if (!disabled) {
      hapticButtonPress();
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <AdaptiveGlassView
        style={styles.glassView}
        isInteractive
        tintColor={colors.primary}
        fallbackColor={colors.primary}
      >
        <Text style={[styles.label, { color: "#FFFFFF" }]}>{label}</Text>
      </AdaptiveGlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 30,
  },
  glassView: {
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
