import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { GlassOption } from "@/components/ui/GlassOption";
import { useAppTheme } from "@/lib/theme";

const OPTIONS = [
  { value: "woman", label: "Women", icon: "♀" },
  { value: "man", label: "Men", icon: "♂" },
  { value: "everyone", label: "Everyone", icon: "💫" },
];

export default function LookingForScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const handleSelect = (value: string) => {
    const lookingForValue = value === "everyone" 
      ? JSON.stringify(["woman", "man"]) 
      : JSON.stringify([value]);
    
    router.push({
      pathname: "/(app)/onboarding/age-range",
      params: { ...params, lookingFor: lookingForValue },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <Text style={styles.emoji}>💕</Text>
          <Text style={[styles.title, { color: colors.onBackground }]}>{"I'm interested in..."}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Who would you like to meet?</Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {OPTIONS.map((option, index) => (
            <Animated.View key={option.value} entering={FadeInDown.delay(200 + index * 100).duration(500)}>
              <GlassOption
                icon={option.icon}
                label={option.label}
                onPress={() => handleSelect(option.value)}
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
