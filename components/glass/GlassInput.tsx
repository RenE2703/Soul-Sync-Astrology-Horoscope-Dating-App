import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { TextInput, TextInputProps, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

type GlassInputProps = Omit<TextInputProps, "style">;

const containerStyle = {
  height: 54,
  borderRadius: 14,
  borderCurve: "continuous" as const,
  justifyContent: "center" as const,
  overflow: "hidden" as const,
};

export function GlassInput(props: GlassInputProps) {
  const { colors, isDark } = useAppTheme();

  const textColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const placeholderColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";

  const inputElement = (
    <TextInput
      style={{
        flex: 1,
        paddingHorizontal: 18,
        fontSize: 17,
        color: textColor,
      }}
      placeholderTextColor={placeholderColor}
      {...props}
    />
  );

  // iOS 26+ - use liquid glass
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={containerStyle} isInteractive>
        {inputElement}
      </GlassView>
    );
  }

  // iOS < 26 - use blur with appropriate tint
  if (process.env.EXPO_OS === "ios") {
    return (
      <BlurView
        tint={isDark ? "systemThickMaterialDark" : "systemThinMaterial"}
        intensity={60}
        style={containerStyle}
      >
        {inputElement}
      </BlurView>
    );
  }

  // Android/web - subtle background
  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {inputElement}
    </View>
  );
}
