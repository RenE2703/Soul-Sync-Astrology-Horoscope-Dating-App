import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

import { GlassButton } from "@/components/glass";
import { HeaderIcon } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

export default function BirthTimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const [birthTime, setBirthTime] = useState<Date>(new Date(new Date().setHours(12, 0, 0, 0)));

  const handleContinue = () => {
    // Format to HH:mm
    const hours = birthTime.getHours().toString().padStart(2, "0");
    const minutes = birthTime.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    router.push({
      pathname: "/(app)/onboarding/system",
      params: { ...params, birthTime: timeString },
    });
  };

  const handleSkip = () => {
    router.push({
        pathname: "/(app)/onboarding/system",
        params: { ...params, birthTime: "12:00" }, // Unknown time defaults to noon
      });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <HeaderIcon icon="time-outline" />
          <Text style={[styles.title, { color: colors.onBackground }]}>What time were you born?</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Used for accurate astrological & Tu Vi charts</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.pickerContainer}>
          <DateTimePicker
            value={birthTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => date && setBirthTime(date)}
            textColor={colors.onBackground}
          />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
        <GlassButton onPress={handleContinue} label="Continue" />
        <View style={{height: 12}} />
        <GlassButton onPress={handleSkip} label="I don't know my birth time" variant="glass" />
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
