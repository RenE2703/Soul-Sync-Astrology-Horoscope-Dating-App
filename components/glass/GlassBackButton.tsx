import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassBackButtonProps {
  /** Custom onPress handler. If not provided, navigates back using router.back() */
  onPress?: () => void;
}

export function GlassBackButton({ onPress }: GlassBackButtonProps = {}) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const handleBack = () => {
    hapticButtonPress();
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const content = (
    <Text style={styles.backIcon}>←</Text>
  );

  if (supportsGlassEffect) {
    return (
      <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
        <GlassView style={styles.button} glassEffectStyle="regular" isInteractive>
          {content}
        </GlassView>
      </TouchableOpacity>
    );
  }

  // Fallback for non-iOS 26
  return (
    <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
      <View style={[styles.button, styles.fallback, { backgroundColor: colors.surfaceVariant }]}>
        {content}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  fallback: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
});
