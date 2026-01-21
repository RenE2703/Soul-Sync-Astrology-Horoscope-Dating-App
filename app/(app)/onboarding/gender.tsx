import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { GlassOption } from "@/components/ui/GlassOption";
import { useAppTheme } from "@/lib/theme";

const GENDERS = [
  { value: "woman", label: "Woman", icon: "♀" },
  { value: "man", label: "Man", icon: "♂" },
];

export default function GenderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const handleSelect = (value: string) => {
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

        <View style={styles.optionsContainer}>
          {GENDERS.map((g, index) => (
            <Animated.View key={g.value} entering={FadeInDown.delay(200 + index * 100).duration(500)}>
              <GlassOption
                icon={g.icon}
                label={g.label}
                onPress={() => handleSelect(g.value)}
              />
            </Animated.View>
          ))}
        </View>
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
  optionsContainer: { gap: 16 },
});
