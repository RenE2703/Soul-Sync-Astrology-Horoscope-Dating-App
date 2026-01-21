import { Image, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

interface ChatHeaderProps {
  name: string;
  imageUri: string;
}

export function ChatHeader({ name, imageUri }: ChatHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.avatar} />
      <Text style={[styles.name, { color: colors.onBackground }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
});
