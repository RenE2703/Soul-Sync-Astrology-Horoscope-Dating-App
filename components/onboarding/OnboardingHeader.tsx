import { usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassBackButton } from "@/components/glass";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

const STEPS = ["name", "birthday", "gender", "looking-for", "age-range", "location", "bio", "interests", "photos", "complete"];

export function OnboardingHeader() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Extract current step from pathname
  const currentStep = pathname.split("/").pop() || "name";
  const stepIndex = STEPS.indexOf(currentStep);
  const step = stepIndex >= 0 ? stepIndex + 1 : 1;
  const totalSteps = STEPS.length - 1; // Exclude 'complete' from progress
  const isFirstStep = step === 1;
  const isComplete = currentStep === "complete";

  const progressPercent = isComplete ? 100 : Math.round((step / totalSteps) * 100);

  if (isComplete) return null;

  return (
    <AdaptiveGlassView
      style={[styles.header, { paddingTop: insets.top + 8 }]}
      fallbackColor={colors.background}
    >
      <View style={styles.row}>
        {/* No button on first step - onboarding is mandatory for new users */}
        {isFirstStep ? <View style={styles.placeholder} /> : <GlassBackButton />}

        <View style={styles.progressWrapper}>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
          {step}/{totalSteps}
        </Text>
      </View>
    </AdaptiveGlassView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  placeholder: {
    width: 44, // Same width as GlassBackButton for alignment
    height: 44,
  },
  progressWrapper: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 32,
    textAlign: "right",
  },
});
