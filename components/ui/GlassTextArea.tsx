import { GlassView } from "expo-glass-effect";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

type GlassTextAreaProps = Omit<TextInputProps, "style">;

export function GlassTextArea(props: GlassTextAreaProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <GlassView style={styles.glassView} glassEffectStyle="regular" isInteractive>
        <TextInput
          style={[styles.input, { color: colors.onSurface }]}
          placeholderTextColor={colors.onSurfaceVariant}
          multiline
          textAlignVertical="top"
          {...props}
        />
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassView: {
    flex: 1,
    maxHeight: 200,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    padding: 20,
    fontSize: 17,
    lineHeight: 26,
  },
});
