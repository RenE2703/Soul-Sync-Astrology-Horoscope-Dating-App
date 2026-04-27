import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ChatRoom } from "@/components/chat";
import { EmptyState } from "@/components/ui";

import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

export default function ChatListScreen() {
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const isLargeScreen = width >= 768;
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Get matches with last message
  const matchesWithMessages = useQuery(
    api.messages.getMatchesWithLastMessage,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const renderChatItem = ({
    item,
  }: {
    item: NonNullable<typeof matchesWithMessages>[number];
  }) => {
    if (!item.otherUser) return null;

    const imageUri =
      item.otherUser.photos?.[0] ||
      `https://api.dicebear.com/7.x/avataaars/png?seed=${item.otherUser.name}`;

    const lastMessageTime = item.lastMessage
      ? new Date(item.lastMessage.createdAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
      : new Date(item.matchedAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });

    const lastMessagePreview = item.lastMessage
      ? item.lastMessage.content
      : "Say hi! 👋";

    const isSelected = isLargeScreen && selectedChatId === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.chatItem, 
          { backgroundColor: isSelected ? colors.primaryContainer : "transparent" }
        ]}
        onPress={() => {
          hapticButtonPress();
          if (isLargeScreen) {
            setSelectedChatId(item._id);
          } else {
            router.push(`/(app)/chat/${item._id}`);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: imageUri }} style={styles.avatar} />
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: isSelected ? colors.onPrimaryContainer : colors.onBackground }]}>
              {item.otherUser.name}
            </Text>
            <Text style={[styles.chatTime, { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant, opacity: 0.8 }]}>
              {lastMessageTime}
            </Text>
          </View>
          <Text
            style={[
              styles.chatPreview,
              {
                color: isSelected 
                  ? colors.onPrimaryContainer 
                  : (item.unreadCount > 0 ? colors.onBackground : colors.onSurfaceVariant),
                fontWeight: item.unreadCount > 0 ? "600" : "400",
                opacity: isSelected ? 0.9 : 1,
              },
            ]}
            numberOfLines={1}
          >
            {lastMessagePreview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewMatches = () => {
    const newMatches = matchesWithMessages?.filter((m) => !m.lastMessage) || [];
    if (newMatches.length === 0) return null;

    return (
      <View style={styles.newMatchesSection}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
          New Matches
        </Text>
        <FlatList
          horizontal
          data={newMatches}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newMatchesList}
          renderItem={({ item }) => {
            if (!item.otherUser) return null;
            const imageUri =
              item.otherUser.photos?.[0] ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${item.otherUser.name}`;

            return (
              <TouchableOpacity
                style={styles.newMatchItem}
                onPress={() => {
                  hapticButtonPress();
                  if (isLargeScreen) {
                    setSelectedChatId(item._id);
                  } else {
                    router.push(`/(app)/chat/${item._id}`);
                  }
                }}
              >
                <Image source={{ uri: imageUri }} style={styles.newMatchAvatar} />
                <Text
                  style={[styles.newMatchName, { color: colors.onBackground }]}
                  numberOfLines={1}
                >
                  {item.otherUser.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const conversations = matchesWithMessages?.filter((m) => m.lastMessage) || [];

  const renderListContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>
          Chats
        </Text>
      </View>

      {matchesWithMessages?.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No messages yet"
          subtitle="Start swiping to find your match!"
        />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderNewMatches}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {isLargeScreen ? (
        // Split-pane Desktop Layout
        <View style={styles.splitLayout}>
          {/* Left Sidebar: List */}
          <View style={[styles.sidebar, { backgroundColor: colors.surface, borderColor: colors.outline + "40" }]}>
            {renderListContent()}
          </View>

          {/* Right Pane: Chat Room */}
          <View style={[styles.chatPane, { backgroundColor: colors.surface, borderColor: colors.outline + "40" }]}>
            {selectedChatId ? (
              <ChatRoom matchId={selectedChatId} />
            ) : (
              <View style={styles.emptyPane}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.onSurfaceVariant} style={{ opacity: 0.5, marginBottom: 16 }} />
                <Text style={[styles.emptyPaneTitle, { color: colors.onBackground }]}>Your Messages</Text>
                <Text style={[styles.emptyPaneSubtitle, { color: colors.onSurfaceVariant }]}>Select a chat from the list to start messaging.</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        // Standard Mobile Layout
        renderListContent()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splitLayout: {
    flex: 1,
    flexDirection: "row",
    maxWidth: 1400,
    marginHorizontal: "auto",
    width: "100%",
    padding: 24,
    gap: 20,
  },
  sidebar: {
    width: 340,
    height: "100%",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  chatPane: {
    flex: 1,
    height: "100%",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  emptyPane: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyPaneTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyPaneSubtitle: {
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  list: {
    paddingBottom: 20,
  },
  newMatchesSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  newMatchesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  newMatchItem: {
    alignItems: "center",
    width: 72,
  },
  newMatchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  newMatchName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 16,
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  unreadCount: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
  },
  chatTime: {
    fontSize: 13,
  },
  chatPreview: {
    fontSize: 15,
  },
});
