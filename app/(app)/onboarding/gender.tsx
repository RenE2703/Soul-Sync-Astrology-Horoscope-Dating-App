import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { GenderSelector } from "@/components/preferences";
import { type Gender } from "@/lib/constants/preferences";
import { useAppTheme } from "@/lib/theme";

export default function GenderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const handleSelect = (value: Gender) => {
    router.push({
      pathname: "/(app)/onboarding/looking-for",
      params: { ...params, gender: value },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={[styles.title, { color: colors.onBackground }]}>I am a...</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Select your gender identity</Text>
        </Animated.View>

        <GenderSelector onChange={handleSelect} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  questionContainer: { marginBottom: 40 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
});
