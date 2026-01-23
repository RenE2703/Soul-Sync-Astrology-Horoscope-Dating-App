import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { GlassIconButton } from "./GlassIconButton";

interface GlassCloseButtonProps {
  /** Custom onPress handler. If not provided, uses router.back() */
  onPress?: () => void;
}

/**
 * A glass-effect close button with an X icon.
 * Navigates back by default, or calls custom onPress if provided.
 */
export function GlassCloseButton({ onPress }: GlassCloseButtonProps = {}) {
  const router = useRouter();

  const handleClose = () => {
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

  return (
    <GlassIconButton
      icon={<Text style={styles.closeIcon}>×</Text>}
      onPress={handleClose}
    />
  );
}

const styles = StyleSheet.create({
  closeIcon: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
  },
});
