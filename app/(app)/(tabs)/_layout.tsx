import { DynamicColorIOS } from "react-native";
import {
  NativeTabs,
  Icon,
  Label,
  Badge,
} from "expo-router/unstable-native-tabs";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";

import { api } from "@/convex/_generated/api";
import { AppColors } from "@/lib/theme";

export default function TabLayout() {
  const { user } = useUser();

  // Get unread message count for badge
  // Note: This will work once Convex is connected and user profile exists
  // const unreadCount = useQuery(api.messages.getUnreadCount, 
  //   user?.id ? { userId: user.id } : "skip"
  // );

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
        {/* <Badge>{unreadCount || 0}</Badge> */}
      </NativeTabs.Trigger>

      {/* Profile */}
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
