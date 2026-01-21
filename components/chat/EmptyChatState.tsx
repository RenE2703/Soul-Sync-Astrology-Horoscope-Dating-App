import { Image, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

interface EmptyChatStateProps {
  name: string;
  imageUri: string;
}

export function EmptyChatState({ name, imageUri }: EmptyChatStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.avatar} />
      <Text style={[styles.title, { color: colors.onBackground }]}>
        You matched with {name}!
      </Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        Say something nice to start the conversation
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
