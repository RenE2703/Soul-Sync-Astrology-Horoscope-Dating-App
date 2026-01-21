import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface GlassCloseButtonProps {
  /** Custom onPress handler. If not provided, uses router.back() */
  onPress?: () => void;
}

export function GlassCloseButton({ onPress }: GlassCloseButtonProps = {}) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const handleClose = () => {
    hapticButtonPress();
    if (onPress) {
      onPress();
    } else {
      // Go back to wherever the user came from
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(app)/(tabs)");
      }
    }
  };

  const content = (
    <Text style={styles.closeIcon}>×</Text>
  );

  if (supportsGlassEffect) {
    return (
      <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
        <GlassView style={styles.button} glassEffectStyle="regular" isInteractive>
          {content}
        </GlassView>
      </TouchableOpacity>
    );
  }

  // Fallback for non-iOS 26
  return (
    <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
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
  closeIcon: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
  },
});
