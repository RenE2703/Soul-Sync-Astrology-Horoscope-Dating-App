import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { GlassIconButton } from "./GlassIconButton";

interface GlassBackButtonProps {
  /** Custom onPress handler. If not provided, navigates back using router.back() */
  onPress?: () => void;
}

/**
 * A glass-effect back button with an arrow icon.
 * Navigates back by default, or calls custom onPress if provided.
 */
export function GlassBackButton({ onPress }: GlassBackButtonProps = {}) {
  const router = useRouter();

  const handleBack = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <GlassIconButton
      icon={<Text style={styles.backIcon}>←</Text>}
      onPress={handleBack}
    />
  );
}

const styles = StyleSheet.create({
  backIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
});
