import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatHeader, ChatInput, EmptyChatState, MessageList } from "@/components/chat";
import { KeyboardAwareView } from "@/components/ui";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOptimisticMessages } from "@/hooks/useOptimisticMessages";
import { useAppTheme } from "@/lib/theme";

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const flatListRef = useRef<FlatList>(null);

  const matchId = id as Id<"matches">;

  // Get current user
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get match details
  const matchDetails = useQuery(
    api.matches.getMatchWithUsers,
    matchId ? { matchId } : "skip"
  );

  // Get messages (real-time subscription)
  const serverMessages = useQuery(
    api.messages.getMessages,
    matchId ? { matchId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);

  // Optimistic messages hook
  const { messages, handleSend, handleRetry } = useOptimisticMessages({
    serverMessages,
    matchId,
    senderId: currentUser?._id,
    sendMessage,
  });

  // Get the other user
  const otherUser =
    matchDetails?.user1._id === currentUser?._id
      ? matchDetails?.user2
      : matchDetails?.user1;

  const imageUri =
    otherUser?.photos?.[0] ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.name || "user"}`;

  // Mark messages as read when viewing
  useEffect(() => {
    if (matchId && currentUser?._id) {
      markAsRead({ matchId, userId: currentUser._id });
    }
  }, [matchId, currentUser?._id, serverMessages?.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  // Show loading while data is fetching
  const isLoading =
    currentUser === undefined ||
    matchDetails === undefined ||
    serverMessages === undefined;

  // Header back button component
  const BackButton = (
    <TouchableOpacity onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={28} color={colors.onBackground} />
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "",
            headerLeft: () => BackButton,
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
          }}
        />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={["bottom"]}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <ChatHeader name={otherUser?.name || "Chat"} imageUri={imageUri} />
          ),
          headerLeft: () => BackButton,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <KeyboardAwareView keyboardVerticalOffset={90}>
          {messages?.length === 0 ? (
            <EmptyChatState
              name={otherUser?.name || "your match"}
              imageUri={imageUri}
            />
          ) : (
            <MessageList
              ref={flatListRef}
              messages={messages}
              currentUserId={currentUser?._id}
              onRetry={handleRetry}
            />
          )}

          <ChatInput onSend={handleSend} disabled={!currentUser} />
        </KeyboardAwareView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
