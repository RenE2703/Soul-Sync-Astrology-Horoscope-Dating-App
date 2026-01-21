import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { KeyboardAwareView } from "@/components/ui/KeyboardAwareView";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  const messages = useQuery(
    api.messages.getMessages,
    matchId ? { matchId } : "skip"
  );

  // Send message mutation
  const sendMessage = useMutation(api.messages.sendMessage);

  // Mark messages as read
  const markAsRead = useMutation(api.messages.markAsRead);

  // Get the other user
  const otherUser =
    matchDetails?.user1._id === currentUser?._id
      ? matchDetails?.user2
      : matchDetails?.user1;

  // Mark messages as read when viewing
  useEffect(() => {
    if (matchId && currentUser?._id) {
      markAsRead({ matchId, userId: currentUser._id });
    }
  }, [matchId, currentUser?._id, messages?.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async (content: string) => {
    if (!matchId || !currentUser?._id) return;

    try {
      await sendMessage({
        matchId,
        senderId: currentUser._id,
        content,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Show loading while data is fetching
  const isLoading = currentUser === undefined || matchDetails === undefined || messages === undefined;

  const imageUri =
    otherUser?.photos?.[0] ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.name || "user"}`;

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "",
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color={colors.onBackground}
                />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: colors.background,
            },
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
            <View style={styles.headerTitle}>
              <Image source={{ uri: imageUri }} style={styles.headerAvatar} />
              <Text style={[styles.headerName, { color: colors.onBackground }]}>
                {otherUser?.name || "Chat"}
              </Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={colors.onBackground}
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <KeyboardAwareView keyboardVerticalOffset={90}>
          {messages?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image source={{ uri: imageUri }} style={styles.emptyAvatar} />
              <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>
                You matched with {otherUser?.name}!
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Say something nice to start the conversation
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <MessageBubble
                  content={item.content}
                  isOwn={item.senderId === currentUser?._id}
                  timestamp={item.createdAt}
                />
              )}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
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
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
