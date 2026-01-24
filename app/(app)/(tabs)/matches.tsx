import { Ionicons } from "@expo/vector-icons";
import { useAction, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassHeader } from "@/components/glass";
import { DailyPickCard, MatchModal } from "@/components/matches";
import { Countdown, EmptyState, LoadingScreen } from "@/components/ui";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { CARD_SPACING, CARD_WIDTH } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

// Types for daily picks data
interface DailyPickWithUser {
  pickedUserId: Id<"users">;
  score: number;
  aiExplanation: string;
  sharedInterests: string[];
  status: "pending" | "liked" | "passed";
  user: Doc<"users">;
}

interface DailyPicksData {
  _id: Id<"dailyPicks">;
  userId: Id<"users">;
  picks: DailyPickWithUser[];
  generatedAt: number;
  expiresAt: number;
}

export default function DailyPicksScreen() {
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  // Get daily picks
  const dailyPicks = useQuery(
    api.matches.getDailyPicks,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as DailyPicksData | null | undefined;

  // Actions
  const generateDailyPicks = useAction(api.matches.generateDailyPicks);
  const actOnDailyPick = useAction(api.matches.actOnDailyPick);

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<Doc<"users"> | null>(null);
  const [matchId, setMatchId] = useState<Id<"matches"> | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Generate picks if needed
  useEffect(() => {
    const generateIfNeeded = async () => {
      if (dailyPicks === null && currentUser?._id && !isGenerating) {
        setIsGenerating(true);
        try {
          await generateDailyPicks({ userId: currentUser._id });
        } catch (error) {
          console.error("Failed to generate daily picks:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    generateIfNeeded();
  }, [dailyPicks, currentUser?._id, isGenerating, generateDailyPicks]);

  // Get pending picks (not yet liked/passed)
  const pendingPicks = dailyPicks?.picks.filter((p) => p.status === "pending") ?? [];
  const allReviewed = dailyPicks?.picks && dailyPicks.picks.length > 0 && pendingPicks.length === 0;

  // Handle viewable items change for pager
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Handle like for specific pick
  const handleLikeForPick = async (pick: DailyPickWithUser) => {
    if (!currentUser?._id || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await actOnDailyPick({
        userId: currentUser._id,
        pickedUserId: pick.pickedUserId,
        action: "like",
      });

      if (result.matched && result.matchId) {
        setMatchedUser(pick.user);
        setMatchId(result.matchId);
        setShowMatchModal(true);
      } else {
        // Move to next pick or show all-reviewed
        goToNextPick();
      }
    } catch (error) {
      console.error("Failed to like:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const goToNextPick = () => {
    if (currentIndex < pendingPicks.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
    // If it's the last pick, the query will update and show all-reviewed
  };

  const handleSendMessage = () => {
    setShowMatchModal(false);
    if (matchId) {
      router.push(`/(app)/chat/${matchId}`);
    }
  };

  const handleKeepBrowsing = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
    setMatchId(null);
    goToNextPick();
  };

  // Render pick card
  const renderPickCard = ({ item, index }: { item: DailyPickWithUser; index: number }) => (
    <View style={styles.cardWrapper}>
      <DailyPickCard
        user={item.user}
        matchScore={item.score}
        aiExplanation={item.aiExplanation}
        sharedInterests={item.sharedInterests}
        onLike={() => handleLikeForPick(item)}
        isProcessing={isProcessing && currentIndex === index}
      />
    </View>
  );

  // Loading state
  if (currentUser === undefined || dailyPicks === undefined || isGenerating) {
    return (
      <LoadingScreen
        message={isGenerating ? "Finding your perfect matches..." : "Loading..."}
      />
    );
  }

  // Render the header subtitle
  const SubtitleContent = (
    <View style={styles.subtitleRow}>
      <Ionicons name="refresh" size={12} color={colors.onSurfaceVariant} />
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        Refreshed daily
      </Text>
    </View>
  );

  // Render the timer badge
  const TimerContent = dailyPicks?.expiresAt ? (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
      <Countdown
        targetTime={dailyPicks.expiresAt}
        expiredText="New picks!"
        style={{ ...styles.timerText, color: colors.onSurfaceVariant }}
      />
    </View>
  ) : null;

  // Render position badge (e.g., "1/3") - primary color for visibility
  const PositionBadge = pendingPicks.length > 0 ? (
    <View style={[styles.positionBadge, { backgroundColor: colors.primary }]}>
      <Text style={styles.positionText}>
        {currentIndex + 1}/{pendingPicks.length}
      </Text>
    </View>
  ) : null;

  // Combined right content for header (timer on top, position badge below)
  const HeaderRightContent = (
    <View style={styles.headerRight}>
      {TimerContent}
      {PositionBadge}
    </View>
  );

  // No picks available
  if (!dailyPicks || dailyPicks.picks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <GlassHeader
          title="Today's Picks"
          subtitle={SubtitleContent}
          rightContent={TimerContent}
        />
        <EmptyState
          icon="sparkles-outline"
          title="No picks yet"
          subtitle="We're still finding the perfect matches for you. Check back soon!"
        />
      </SafeAreaView>
    );
  }

  // All picks reviewed
  if (allReviewed) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <GlassHeader
          title="Today's Picks"
          subtitle={SubtitleContent}
          rightContent={TimerContent}
        />
        <EmptyState
          icon="checkmark-circle-outline"
          title="You've seen today's picks!"
          subtitle="Come back tomorrow for 3 new AI-curated matches"
        >
          {dailyPicks?.expiresAt && (
            <View style={styles.countdownContainer}>
              <AdaptiveGlassView style={styles.countdownBadge}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.countdownText, { color: colors.onBackground }]}>
                  New picks in{" "}
                </Text>
                <Countdown
                  targetTime={dailyPicks.expiresAt}
                  expiredText="now!"
                  style={{ ...styles.countdownText, color: colors.onBackground }}
                />
              </AdaptiveGlassView>
            </View>
          )}
        </EmptyState>
      </SafeAreaView>
    );
  }

  // Main view with picks
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Glass Header */}
      <GlassHeader
        title="Today's Picks"
        subtitle={SubtitleContent}
        rightContent={HeaderRightContent}
      />

      {/* Horizontal Pager with peek */}
      <FlatList
        ref={flatListRef}
        data={pendingPicks}
        renderItem={renderPickCard}
        keyExtractor={(item) => item.pickedUserId}
        horizontal
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled={!isProcessing}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
      />

      {/* Match Modal */}
      {currentUser && (
        <MatchModal
          visible={showMatchModal}
          currentUser={currentUser}
          matchedUser={matchedUser}
          onSendMessage={handleSendMessage}
          onKeepSwiping={handleKeepBrowsing}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  positionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  countdownContainer: {
    marginTop: 24,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
