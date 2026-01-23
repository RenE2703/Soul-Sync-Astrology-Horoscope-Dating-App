import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui";

import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

export default function ChatListScreen() {
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const router = useRouter();

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

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.surface }]}
        onPress={() => {
          hapticButtonPress();
          router.push(`/(app)/chat/${item._id}`);
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
            <Text style={[styles.chatName, { color: colors.onBackground }]}>
              {item.otherUser.name}
            </Text>
            <Text style={[styles.chatTime, { color: colors.onSurfaceVariant }]}>
              {lastMessageTime}
            </Text>
          </View>
          <Text
            style={[
              styles.chatPreview,
              {
                color: item.unreadCount > 0
                  ? colors.onBackground
                  : colors.onSurfaceVariant,
                fontWeight: item.unreadCount > 0 ? "600" : "400",
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
                  router.push(`/(app)/chat/${item._id}`);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>
          Messages
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 20,
  },
  newMatchesSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  newMatchesList: {
    paddingHorizontal: 16,
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
    marginBottom: 4,
  },
  newMatchName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 12,
  },
  chatPreview: {
    fontSize: 14,
  },
});
