import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { LookingForSelector } from "@/components/preferences";
import { HeaderIcon } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

export default function LookingForScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const handleSelect = (lookingFor: string[]) => {
    router.push({
      pathname: "/(app)/onboarding/age-range",
      params: { ...params, lookingFor: JSON.stringify(lookingFor) },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <HeaderIcon icon="heart-outline" />
          <Text style={[styles.title, { color: colors.onBackground }]}>{"I'm interested in..."}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Who would you like to meet?</Text>
        </Animated.View>

        <LookingForSelector onChange={handleSelect} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  questionContainer: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
});
