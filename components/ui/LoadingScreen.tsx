import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/lib/theme";

interface LoadingScreenProps {
  /** Loading message to display */
  message?: string;
}

/**
 * Full-screen loading state with ActivityIndicator and optional message.
 * Uses SafeAreaView and theme colors for consistent styling.
 */
export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.onSurfaceVariant }]}>
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  text: {
    fontSize: 16,
  },
});
