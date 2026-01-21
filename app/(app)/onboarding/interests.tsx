import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton, GlassChip } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";

const INTERESTS = [
  { name: "Travel", emoji: "✈️" },
  { name: "Music", emoji: "🎵" },
  { name: "Fitness", emoji: "💪" },
  { name: "Photography", emoji: "📸" },
  { name: "Cooking", emoji: "👨‍🍳" },
  { name: "Reading", emoji: "📚" },
  { name: "Movies", emoji: "🎬" },
  { name: "Art", emoji: "🎨" },
  { name: "Gaming", emoji: "🎮" },
  { name: "Hiking", emoji: "🥾" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Dancing", emoji: "💃" },
  { name: "Coffee", emoji: "☕" },
  { name: "Wine", emoji: "🍷" },
  { name: "Pets", emoji: "🐕" },
  { name: "Sports", emoji: "⚽" },
  { name: "Nature", emoji: "🌿" },
  { name: "Beach", emoji: "🏖️" },
  { name: "Fashion", emoji: "👗" },
  { name: "Foodie", emoji: "🍜" },
];

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 6;

export default function InterestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelected((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length < MAX_INTERESTS) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const isValid = selected.length >= MIN_INTERESTS;

  const handleContinue = () => {
    router.push({
      pathname: "/(app)/onboarding/photos",
      params: { ...params, interests: JSON.stringify(selected) },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <Text style={styles.emoji}>❤️</Text>
          <Text style={[styles.title, { color: colors.onBackground }]}>Your interests</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Select {MIN_INTERESTS}-{MAX_INTERESTS} things you love
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.countBadge}>
          <Text style={[styles.countText, { color: isValid ? colors.primary : colors.onSurfaceVariant }]}>
            {selected.length} of {MAX_INTERESTS} selected
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.interestsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.interestsGrid}>
            {INTERESTS.map((interest) => (
              <GlassChip
                key={interest.name}
                emoji={interest.emoji}
                label={interest.name}
                selected={selected.includes(interest.name)}
                onPress={() => toggleInterest(interest.name)}
              />
            ))}
          </Animated.View>
        </ScrollView>
      </View>

      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.footer}>
        <GlassButton onPress={handleContinue} label="Complete Profile" disabled={!isValid} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 24 },
  questionContainer: { marginBottom: 16, paddingHorizontal: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  countBadge: { marginBottom: 16, paddingHorizontal: 24 },
  countText: { fontSize: 15, fontWeight: "600" },
  scrollView: { flex: 1, overflow: "visible" },
  interestsContainer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer: { padding: 24 },
});
