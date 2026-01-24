import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton } from "@/components/glass";
import { DateOfBirthPicker, getDefaultDateOfBirth } from "@/components/preferences";
import { HeaderIcon } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

export default function BirthdayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const [birthDate, setBirthDate] = useState<Date>(getDefaultDateOfBirth());

  const handleContinue = () => {
    router.push({
      pathname: "/(app)/onboarding/gender",
      params: { ...params, dateOfBirth: birthDate.getTime().toString() },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <HeaderIcon icon="calendar-outline" />
          <Text style={[styles.title, { color: colors.onBackground }]}>{"When's your birthday?"}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Your age will be shown on your profile</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.pickerContainer}>
          <DateOfBirthPicker value={birthDate} onChange={setBirthDate} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
        <GlassButton onPress={handleContinue} label="Continue" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  questionContainer: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  pickerContainer: { alignItems: "center", gap: 24 },
  footer: { padding: 24 },
});
