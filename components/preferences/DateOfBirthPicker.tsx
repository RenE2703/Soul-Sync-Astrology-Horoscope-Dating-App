import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, StyleSheet, Text, View } from "react-native";

import { hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface DateOfBirthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showAgeCard?: boolean;
}

/**
 * Get the minimum valid date of birth (99 years ago)
 */
function getMinDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 99);
  return date;
}

/**
 * Get the maximum valid date of birth (18 years ago - minimum age)
 */
function getMaxDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
}

/**
 * Calculate age from a date
 */
export function calculateAgeFromDate(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get a default date of birth (25 years ago)
 */
export function getDefaultDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 25);
  return date;
}

export function DateOfBirthPicker({ 
  value, 
  onChange, 
  showAgeCard = true 
}: DateOfBirthPickerProps) {
  const { colors } = useAppTheme();
  const age = calculateAgeFromDate(value);

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      hapticSelection();
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      {showAgeCard && (
        <View style={[styles.ageCard, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.ageNumber, { color: colors.primary }]}>{age}</Text>
          <Text style={[styles.ageLabel, { color: colors.onPrimaryContainer }]}>years old</Text>
        </View>
      )}
      <View style={styles.datePickerWrapper}>
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          maximumDate={getMaxDate()}
          minimumDate={getMinDate()}
          themeVariant="light"
          style={styles.datePicker}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
  },
  ageCard: {
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  ageNumber: {
    fontSize: 64,
    fontWeight: "800",
    letterSpacing: -2,
  },
  ageLabel: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: -4,
  },
  datePickerWrapper: {
    alignItems: "center",
    width: "100%",
  },
  datePicker: {
    height: 180,
    width: "100%",
  },
});
