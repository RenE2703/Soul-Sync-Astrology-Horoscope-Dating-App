import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Pressable, Text, View } from "react-native";

import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  variant?: "primary" | "glass";
}

const buttonStyle = {
  height: 56,
  borderRadius: 28,
  borderCurve: "continuous" as const,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  paddingHorizontal: 24,
  overflow: "hidden" as const,
};

export function GlassButton({
  onPress,
  label,
  disabled = false,
  variant = "primary",
}: GlassButtonProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    if (!disabled) {
      hapticButtonPress();
      onPress();
    }
  };

  const labelElement = (
    <Text style={{ fontSize: 17, fontWeight: "600", color: "#FFFFFF" }}>
      {label}
    </Text>
  );

  // Primary variant - solid color button
  if (variant === "primary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => ({
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          transform: pressed ? [{ scale: 0.98 }] : [],
        })}
      >
        <View style={[buttonStyle, { backgroundColor: colors.primary }]}>
          {labelElement}
        </View>
      </Pressable>
    );
  }

  // Glass variant
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        transform: pressed ? [{ scale: 0.98 }] : [],
      })}
    >
      {isLiquidGlassAvailable() ? (
        <GlassView style={buttonStyle} isInteractive>
          {labelElement}
        </GlassView>
      ) : process.env.EXPO_OS === "ios" ? (
        <BlurView tint="light" intensity={60} style={buttonStyle}>
          {labelElement}
        </BlurView>
      ) : (
        <View
          style={[
            buttonStyle,
            {
              backgroundColor: "rgba(255,255,255,0.2)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            },
          ]}
        >
          {labelElement}
        </View>
      )}
    </Pressable>
  );
}
