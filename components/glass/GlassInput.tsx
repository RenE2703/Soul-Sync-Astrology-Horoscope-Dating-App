import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

type GlassInputProps = Omit<TextInputProps, "style">;

export function GlassInput(props: GlassInputProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <AdaptiveGlassView
        style={styles.glassView}
        isInteractive
        fallbackStyle={styles.fallback}
      >
        <TextInput
          style={[styles.input, { color: colors.onSurface }]}
          placeholderTextColor={colors.onSurfaceVariant}
          {...props}
        />
      </AdaptiveGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container needed for proper glass rendering
  },
  glassView: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
  },
  fallback: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: "500",
  },
});
