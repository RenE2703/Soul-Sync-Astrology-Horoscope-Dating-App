import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton, GlassChip } from "@/components/glass";
import { HeaderIcon } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

// Deal-breaker options per category
const RELIGION_OPTIONS = [
  { emoji: "🌐", name: "Any" },
  { emoji: "☸️", name: "Buddhist" },
  { emoji: "✝️", name: "Christian" },
  { emoji: "☪️", name: "Muslim" },
  { emoji: "🕉️", name: "Hindu" },
  { emoji: "✡️", name: "Jewish" },
  { emoji: "🚫", name: "Atheist" },
  { emoji: "🔮", name: "Other" },
];

const FAMILY_OPTIONS = [
  { emoji: "🌐", name: "Any" },
  { emoji: "🏛️", name: "Traditional" },
  { emoji: "🌱", name: "Modern" },
  { emoji: "🤝", name: "Mixed" },
];

const POLITICAL_OPTIONS = [
  { emoji: "🌐", name: "Any" },
  { emoji: "🕊️", name: "Liberal" },
  { emoji: "🦅", name: "Conservative" },
  { emoji: "⚖️", name: "Moderate" },
  { emoji: "😌", name: "Apolitical" },
];

export default function DealBreakersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const [religion, setReligion] = useState("Any");
  const [familyBackground, setFamilyBackground] = useState("Any");
  const [politicalView, setPoliticalView] = useState("Any");

  const handleContinue = () => {
    router.push({
      pathname: "/(app)/onboarding/photos",
      params: {
        ...params,
        dealBreakers_religion: religion,
        dealBreakers_familyBackground: familyBackground,
        dealBreakers_politicalView: politicalView,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <HeaderIcon icon="shield-checkmark-outline" />
          <Text style={[styles.title, { color: colors.onBackground }]}>Your deal-breakers</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Set non-negotiable preferences to save time. Only compatible matches will appear.
          </Text>
        </Animated.View>

        {/* Religion */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Religion</Text>
          <View style={styles.optionsGrid}>
            {RELIGION_OPTIONS.map((opt) => (
              <GlassChip
                key={opt.name}
                emoji={opt.emoji}
                label={opt.name}
                selected={religion === opt.name}
                onPress={() => setReligion(opt.name)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Family Background */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Family Background</Text>
          <View style={styles.optionsGrid}>
            {FAMILY_OPTIONS.map((opt) => (
              <GlassChip
                key={opt.name}
                emoji={opt.emoji}
                label={opt.name}
                selected={familyBackground === opt.name}
                onPress={() => setFamilyBackground(opt.name)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Political View */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Political View</Text>
          <View style={styles.optionsGrid}>
            {POLITICAL_OPTIONS.map((opt) => (
              <GlassChip
                key={opt.name}
                emoji={opt.emoji}
                label={opt.name}
                selected={politicalView === opt.name}
                onPress={() => setPoliticalView(opt.name)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.footer}>
        <GlassButton onPress={handleContinue} label="Continue" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  questionContainer: { marginBottom: 24, paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  section: { marginBottom: 24, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer: { padding: 24 },
});
