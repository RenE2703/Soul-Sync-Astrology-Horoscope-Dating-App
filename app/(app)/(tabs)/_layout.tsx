import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import {
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import { DynamicColorIOS } from "react-native";

import { supportsGlassEffect } from "@/lib/glass";
import { AppColors, useAppTheme } from "@/lib/theme";

export default function TabLayout() {
  const { colors } = useAppTheme();

  // Use NativeTabs on iOS 26+, fallback to regular Tabs on other platforms
  if (supportsGlassEffect) {
    return (
      <NativeTabs
        minimizeBehavior="onScrollDown"
        labelStyle={{
          color: DynamicColorIOS({
            dark: "white",
            light: "black",
          }),
        }}
        tintColor={AppColors.primary}
      >
        {/* Discover / Swipe Feed */}
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "heart", selected: "heart.fill" }} />
          <Label>Discover</Label>
        </NativeTabs.Trigger>

        {/* AI Suggested Matches */}
        <NativeTabs.Trigger name="matches">
          <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
          <Label>AI Matches</Label>
        </NativeTabs.Trigger>

        {/* Chat / Messages */}
        <NativeTabs.Trigger name="chat">
          <Icon sf={{ default: "message", selected: "message.fill" }} />
          <Label>Chat</Label>
        </NativeTabs.Trigger>

        {/* Profile */}
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person", selected: "person.fill" }} />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Fallback to regular Tabs for non-iOS 26 devices
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.background,
          paddingTop: 10,
          marginTop: -65,
          paddingBottom: 10,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.outline,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "AI Matches",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
