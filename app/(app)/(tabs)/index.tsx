import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FloatingActions } from "@/components/cards/FloatingActions";
import { MatchModal } from "@/components/cards/MatchModal";
import { ProfileView } from "@/components/cards/ProfileView";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/lib/theme";

export default function DiscoverScreen() {
  const { colors } = useAppTheme();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get swipe feed - only query if we have a user profile
  // Convex is realtime - feed auto-updates when swipes are recorded
  const swipeFeed = useQuery(
    api.swipes.getSwipeFeed,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  // Swipe mutation
  const createSwipe = useMutation(api.swipes.createSwipe);

  // State
  const [matchedUser, setMatchedUser] = useState<Doc<"users"> | null>(null);
  const [matchId, setMatchId] = useState<Id<"matches"> | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Always show the first profile - Convex removes swiped profiles automatically
  const currentProfile = swipeFeed?.[0];

  const handleAction = async (action: "like" | "reject") => {
    if (!currentUser?._id || !currentProfile?._id || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await createSwipe({
        swiperId: currentUser._id,
        swipedId: currentProfile._id,
        action,
      });

      if (result.matched && result.matchId) {
        setMatchedUser(currentProfile);
        setMatchId(result.matchId);
        setShowMatchModal(true);
      }
    } catch (error) {
      console.error("Failed to record action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLike = () => handleAction("like");
  const handleReject = () => handleAction("reject");

  const handleSendMessage = () => {
    setShowMatchModal(false);
    if (matchId) {
      router.push(`/(app)/chat/${matchId}`);
    }
  };

  const handleKeepSwiping = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
    setMatchId(null);
  };

  // Still loading from Convex (protected route handles no-profile case)
  if (currentUser === undefined || currentUser === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading swipe feed
  if (swipeFeed === undefined) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Finding people near you...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No more profiles
  if (!currentProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😅</Text>
          <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>
            No more profiles
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
            Check back later for new matches
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile View */}
      <ProfileView key={currentProfile._id} user={currentProfile} />

      {/* Floating Action Buttons */}
      <FloatingActions
        onReject={handleReject}
        onLike={handleLike}
        disabled={isProcessing}
      />

      {/* Match Modal */}
      <MatchModal
        visible={showMatchModal}
        currentUser={currentUser}
        matchedUser={matchedUser}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
      />
    </View>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});
