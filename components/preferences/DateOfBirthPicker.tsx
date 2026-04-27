import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, StyleSheet, Text, View } from "react-native";
import { createElement } from "react";

import {
  calculateAgeFromDate,
  getDefaultDateOfBirth,
  getMaxDateOfBirth,
  getMinDateOfBirth,
} from "@/lib/dateUtils";
import { hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

// Re-export for backward compatibility
export { calculateAgeFromDate, getDefaultDateOfBirth } from "@/lib/dateUtils";

interface DateOfBirthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showAgeCard?: boolean;
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

  const renderPicker = () => {
    if (Platform.OS === "web") {
      // Use native HTML date input on web
      const dateString = value.toISOString().split("T")[0];
      return createElement("input", {
        type: "date",
        value: dateString,
        max: getMaxDateOfBirth().toISOString().split("T")[0],
        min: getMinDateOfBirth().toISOString().split("T")[0],
        onChange: (e: any) => {
          const newDate = new Date(e.target.value);
          if (!isNaN(newDate.getTime())) {
            handleChange(null, newDate);
          }
        },
        style: {
          padding: "16px 18px",
          borderRadius: "16px",
          border: "2px solid transparent",
          fontSize: "16px",
          width: "100%",
          backgroundColor: "#F8F8F8",
          color: "#1A1A1A",
          outline: "none",
          fontFamily: "inherit",
          cursor: "pointer",
        },
      });
    }

    return (
      <DateTimePicker
        value={value}
        mode="date"
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={handleChange}
        maximumDate={getMaxDateOfBirth()}
        minimumDate={getMinDateOfBirth()}
        themeVariant="light"
        style={styles.datePicker}
      />
    );
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
        {renderPicker()}
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
