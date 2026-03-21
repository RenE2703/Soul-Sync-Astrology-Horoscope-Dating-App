import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { HeaderIcon } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

export default function SystemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const handleSelect = (system: "western" | "tuvi") => {
    router.push({
      pathname: "/(app)/onboarding/gender",
      params: { ...params, preferredSystem: system },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <HeaderIcon icon="planet-outline" />
          <Text style={[styles.title, { color: colors.onBackground }]}>Choose your path</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Which system do you prefer for matching?</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.optionsContainer}>
            <TouchableOpacity 
                style={[styles.option, { borderColor: colors.outline, backgroundColor: colors.surface }]}
                onPress={() => handleSelect("western")}
            >
                <Text style={{fontSize: 40}}>✨</Text>
                <Text style={[styles.optionTitle, {color: colors.onSurface}]}>Western Astrology</Text>
                <Text style={[styles.optionDesc, {color: colors.onSurfaceVariant}]}>Zodiac, Sun, Moon & Rising signs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.option, { borderColor: colors.outline, backgroundColor: colors.surface }]}
                onPress={() => handleSelect("tuvi")}
            >
                <Text style={{fontSize: 40}}>☯️</Text>
                <Text style={[styles.optionTitle, {color: colors.onSurface}]}>Tử Vi Việt Nam</Text>
                <Text style={[styles.optionDesc, {color: colors.onSurfaceVariant}]}>Bát Tự, Mệnh & Ngũ Hành</Text>
            </TouchableOpacity>
        </Animated.View>
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
  optionsContainer: { gap: 16 },
  option: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  optionTitle: { fontSize: 20, fontWeight: "600" },
  optionDesc: { fontSize: 15, textAlign: "center" }
});
