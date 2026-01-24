import { Stack } from "expo-router";

import { OnboardingHeader } from "@/components/onboarding";
import { useAppTheme } from "@/lib/theme";

export default function OnboardingLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        header: () => <OnboardingHeader />,
        gestureEnabled: true,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="name" options={{ gestureEnabled: false }} />
      <Stack.Screen name="birthday" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="looking-for" />
      <Stack.Screen name="age-range" />
      <Stack.Screen name="location" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="complete" options={{ gestureEnabled: false, headerShown: false }} />
    </Stack>
  );
}
