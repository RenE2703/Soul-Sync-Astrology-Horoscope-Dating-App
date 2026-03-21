import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/lib/theme";

export default function AppLayout() {
  const { user } = useUser();
  const { colors } = useAppTheme();
  const segments = useSegments();

  const profile = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Still loading - show a spinner
  if (profile === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasProfile = profile !== null;
  const inOnboarding = (segments as string[]).includes("onboarding");

  if (!hasProfile && !inOnboarding) {
    return <Redirect href={"/(app)/onboarding" as any} />;
  }

  if (hasProfile && inOnboarding) {
    return <Redirect href={"/(app)/(tabs)" as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, title: "Edit Profile" }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: "Chat" }} />
      <Stack.Screen name="profile/[id]" options={{ presentation: "modal" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
