import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton } from "@/components/ui/GlassButton";
import { hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

const getDefaultDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 25);
  return date;
};

const getMinDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 99);
  return date;
};

const getMaxDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
};

export default function BirthdayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();

  const [birthDate, setBirthDate] = useState<Date>(getDefaultDate());

  const calculateAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(birthDate);

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      hapticSelection();
      setBirthDate(selectedDate);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: "/(app)/onboarding/gender",
      params: { ...params, age: age.toString(), birthDate: birthDate.toISOString() },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
          <Text style={styles.emoji}>🎂</Text>
          <Text style={[styles.title, { color: colors.onBackground }]}>{"When's your birthday?"}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Your age will be shown on your profile</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.pickerContainer}>
          <View style={[styles.ageCard, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.ageNumber, { color: colors.primary }]}>{age}</Text>
            <Text style={[styles.ageLabel, { color: colors.onPrimaryContainer }]}>years old</Text>
          </View>
          <View style={styles.datePickerWrapper}>
            <DateTimePicker
              value={birthDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              maximumDate={getMaxDate()}
              minimumDate={getMinDate()}
              themeVariant="light"
              style={styles.datePicker}
            />
          </View>
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
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  pickerContainer: { alignItems: "center", gap: 24 },
  ageCard: { paddingHorizontal: 48, paddingVertical: 24, borderRadius: 24, alignItems: "center" },
  ageNumber: { fontSize: 64, fontWeight: "800", letterSpacing: -2 },
  ageLabel: { fontSize: 18, fontWeight: "500", marginTop: -4 },
  datePickerWrapper: { alignItems: "center", width: "100%" },
  datePicker: { height: 180, width: "100%" },
  footer: { padding: 24 },
});
