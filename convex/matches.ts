import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { areUsersCompatible } from "./lib/compatibility";
import { generateChatCompletion } from "./lib/openai";
import { withResolvedPhotos } from "./lib/photos";
import { getAllMatchesForUser, getOtherUserId } from "./lib/utils";

// Types for vector search results
interface VectorSearchResult {
  _id: Id<"users">;
  _score: number;
}

// Get all matches for a user
export const getMatches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allMatches = await getAllMatchesForUser(ctx, args.userId);

    // Get the other user's profile for each match (with resolved photos)
    const matchesWithProfiles = await Promise.all(
      allMatches.map(async (match) => {
        const otherUserId = getOtherUserId(match, args.userId);
        const otherUser = await ctx.db.get(otherUserId);
        const otherUserWithPhotos = await withResolvedPhotos(ctx, otherUser);
        return {
          ...match,
          otherUser: otherUserWithPhotos,
        };
      }),
    );

    return matchesWithProfiles.sort((a, b) => b.matchedAt - a.matchedAt);
  },
});

// Check if two users have matched
export const checkMatch = query({
  args: { user1Id: v.id("users"), user2Id: v.id("users") },
  handler: async (ctx, args) => {
    // Check both orderings
    const match1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.user1Id))
      .filter((q) => q.eq(q.field("user2Id"), args.user2Id))
      .first();

    if (match1) return match1;

    const match2 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.user2Id))
      .filter((q) => q.eq(q.field("user2Id"), args.user1Id))
      .first();

    return match2;
  },
});

// Create a match (internal - called when mutual like detected)
export const createMatch = internalMutation({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  },
  handler: async (ctx, args): Promise<Id<"matches">> => {
    return await ctx.db.insert("matches", {
      user1Id: args.user1Id,
      user2Id: args.user2Id,
      matchedAt: Date.now(),
    });
  },
});

// Update match with AI explanation
export const updateMatchExplanation = internalMutation({
  args: {
    matchId: v.id("matches"),
    aiExplanation: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.matchId, {
      aiExplanation: args.aiExplanation,
    });
  },
});

// Internal query to get match
export const getMatchInternal = internalQuery({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.matchId);
  },
});

// Get match with both user profiles (with resolved photos)
export const getMatchWithUsers = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    const user1 = await ctx.db.get(match.user1Id);
    const user2 = await ctx.db.get(match.user2Id);

    if (!user1 || !user2) return null;

    // Resolve photo URLs for both users
    const user1WithPhotos = await withResolvedPhotos(ctx, user1);
    const user2WithPhotos = await withResolvedPhotos(ctx, user2);

    return {
      ...match,
      user1: user1WithPhotos,
      user2: user2WithPhotos,
    };
  },
});

// Generate AI explanation for a match
export const generateMatchExplanation = action({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args): Promise<string> => {
    const match = await ctx.runQuery(internal.matches.getMatchInternal, {
      matchId: args.matchId,
    });

    if (!match) throw new Error("Match not found");

    const user1 = await ctx.runQuery(internal.users.getInternal, {
      id: match.user1Id,
    });
    const user2 = await ctx.runQuery(internal.users.getInternal, {
      id: match.user2Id,
    });

    if (!user1 || !user2) throw new Error("Users not found");

    const prompt: string = `You are a mystical matchmaker and spiritual guide, expert in Western Astrology and Vietnamese Tu Vi. Given these two dating profiles and their cosmic traits, explain in 2-3 warm, encouraging sentences why they would be compatible romantically. Be specific about their shared interests or how their energies/elements/signs align perfectly.

Profile 1:
Name: ${user1.name}
Bio: ${user1.bio}
Interests: ${user1.interests.join(", ")}
Astrology: ${JSON.stringify(user1.astrologyData || {})}
Preferred Matching System: ${user1.preferredSystem || "western"}

Profile 2:
Name: ${user2.name}
Bio: ${user2.bio}
Interests: ${user2.interests.join(", ")}
Astrology: ${JSON.stringify(user2.astrologyData || {})}

Write a brief, personalized cosmic match explanation:`;

    const explanation: string = await generateChatCompletion(prompt, {
      maxTokens: 150,
      temperature: 0.7,
    });

    await ctx.runMutation(internal.matches.updateMatchExplanation, {
      matchId: args.matchId,
      aiExplanation: explanation,
    });

    return explanation;
  },
});

// ============================================
// DAILY PICKS - 3 premium AI-curated matches per day
// ============================================

// Types for daily picks
interface DailyPick {
  pickedUserId: Id<"users">;
  score: number;
  aiExplanation: string;
  sharedInterests: string[];
  status: "pending" | "liked" | "passed";
}

interface DailyPickWithUser extends DailyPick {
  user: Doc<"users">;
}

// Get today's daily picks for a user
export const getDailyPicks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find existing daily picks
    const existingPicks = await ctx.db
      .query("dailyPicks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // If no picks or expired, return null (frontend will trigger generation)
    if (!existingPicks || existingPicks.expiresAt < now) {
      return null;
    }

    // Get user profiles for each pick (with resolved photos)
    const picksWithUsers: DailyPickWithUser[] = [];

    for (const pick of existingPicks.picks) {
      const user = await ctx.db.get(pick.pickedUserId);
      if (user) {
        const userWithPhotos = await withResolvedPhotos(ctx, user);
        if (userWithPhotos) {
          picksWithUsers.push({
            ...pick,
            user: userWithPhotos,
          });
        }
      }
    }

    return {
      ...existingPicks,
      picks: picksWithUsers,
    };
  },
});

// Internal query for daily picks (used by actions)
export const getDailyPicksInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyPicks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Clear daily picks so they regenerate (for testing / manual refresh)
export const clearDailyPicks = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyPicks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Save or update daily picks (internal)
export const saveDailyPicks = internalMutation({
  args: {
    userId: v.id("users"),
    picks: v.array(
      v.object({
        pickedUserId: v.id("users"),
        score: v.float64(),
        aiExplanation: v.string(),
        sharedInterests: v.array(v.string()),
        status: v.union(
          v.literal("pending"),
          v.literal("liked"),
          v.literal("passed"),
        ),
      }),
    ),
    generatedAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Delete any existing picks for this user
    const existing = await ctx.db
      .query("dailyPicks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new picks
    return await ctx.db.insert("dailyPicks", {
      userId: args.userId,
      picks: args.picks,
      generatedAt: args.generatedAt,
      expiresAt: args.expiresAt,
    });
  },
});

// Update pick status (like/pass)
export const updatePickStatus = internalMutation({
  args: {
    dailyPicksId: v.id("dailyPicks"),
    pickedUserId: v.id("users"),
    status: v.union(v.literal("liked"), v.literal("passed")),
  },
  handler: async (ctx, args) => {
    const dailyPicks = await ctx.db.get(args.dailyPicksId);
    if (!dailyPicks) return;

    const updatedPicks = dailyPicks.picks.map((pick) =>
      pick.pickedUserId === args.pickedUserId
        ? { ...pick, status: args.status }
        : pick,
    );

    await ctx.db.patch(args.dailyPicksId, { picks: updatedPicks });
  },
});

// Generate daily picks with AI explanations
// Uses progressive filter relaxation to guarantee at least 1 pick per day
export const generateDailyPicks = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getInternal, {
      id: args.userId,
    });

    if (!user || !user.embedding) {
      throw new Error("User not found or has no embedding");
    }

    // Vector search for similar profiles (wider pool)
    const results: VectorSearchResult[] = await ctx.vectorSearch(
      "users",
      "by_embedding_v3_final",
      {
        vector: user.embedding,
        limit: 50,
      },
    );

    // ── Progressive filter relaxation ──────────────────────────
    // Pass 1: strict (gender + age + distance + deal-breakers)
    // Pass 2: relax distance (skip distance check)
    // Pass 3: relax age + distance
    // Pass 4: only gender filter (absolute minimum)
    // This guarantees we almost always find at least 1 pick.

    type FilterPass = {
      label: string;
      check: (candidate: Doc<"users">) => boolean;
    };

    const filterPasses: FilterPass[] = [
      {
        label: "strict",
        check: (candidate) => areUsersCompatible(user, candidate),
      },
      {
        label: "relaxed-distance",
        check: (candidate) => {
          // Gender preferences (bidirectional)
          if (!user.lookingFor.includes(candidate.gender)) return false;
          if (!candidate.lookingFor.includes(user.gender)) return false;
          // Age preferences (bidirectional)
          if (candidate.age < user.ageRange.min || candidate.age > user.ageRange.max) return false;
          if (user.age < candidate.ageRange.min || user.age > candidate.ageRange.max) return false;
          // Skip distance check
          return true;
        },
      },
      {
        label: "relaxed-age-distance",
        check: (candidate) => {
          // Gender preferences only (bidirectional)
          if (!user.lookingFor.includes(candidate.gender)) return false;
          if (!candidate.lookingFor.includes(user.gender)) return false;
          // Skip age + distance
          return true;
        },
      },
      {
        label: "gender-only",
        check: (candidate) => {
          // Only check user's gender preference (one-directional)
          if (!user.lookingFor.includes(candidate.gender)) return false;
          return true;
        },
      },
    ];

    const topPicks: {
      userId: Id<"users">;
      score: number;
      user: Doc<"users">;
    }[] = [];

    // Pre-filter: collect all non-self, non-swiped candidates
    const validCandidates: { id: Id<"users">; score: number; user: Doc<"users"> }[] = [];

    for (const result of results) {
      if (result._id === args.userId) continue;

      const candidate = await ctx.runQuery(internal.users.getInternal, {
        id: result._id,
      });
      if (!candidate) continue;

      // Check if already swiped
      const existingSwipe = await ctx.runQuery(internal.swipes.getSwipe, {
        swiperId: args.userId,
        swipedId: result._id,
      });
      if (existingSwipe) continue;

      validCandidates.push({
        id: result._id,
        score: result._score,
        user: candidate,
      });
    }

    // Run progressive passes until we have at least 1 pick (max 3)
    const pickedIds = new Set<string>();

    for (const pass of filterPasses) {
      if (topPicks.length >= 3) break;

      for (const candidate of validCandidates) {
        if (topPicks.length >= 3) break;
        if (pickedIds.has(candidate.id)) continue;

        if (pass.check(candidate.user)) {
          topPicks.push({
            userId: candidate.id,
            score: candidate.score,
            user: candidate.user,
          });
          pickedIds.add(candidate.id);
        }
      }

      // If we have at least 1 pick after this pass, stop relaxing
      if (topPicks.length > 0) break;
    }

    // Last resort: if still 0 picks, just grab the highest-scoring non-swiped candidate
    if (topPicks.length === 0 && validCandidates.length > 0) {
      const fallback = validCandidates[0]; // already sorted by vector score
      topPicks.push({
        userId: fallback.id,
        score: fallback.score,
        user: fallback.user,
      });
    }

    if (topPicks.length === 0) {
      // Truly no candidates at all (empty DB)
      const now = Date.now();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      await ctx.runMutation(internal.matches.saveDailyPicks, {
        userId: args.userId,
        picks: [],
        generatedAt: now,
        expiresAt: midnight.getTime(),
      });

      return { success: true, count: 0 };
    }

    // Generate AI explanations for each pick
    const picksWithExplanations: DailyPick[] = [];

    for (const pick of topPicks) {
      // Find shared interests
      const sharedInterests = user.interests.filter((interest: string) =>
        pick.user.interests.includes(interest),
      );

      const prompt = `You are a mystical matchmaker expert in Western Astrology and Vietnamese Tu Vi. Given these two profiles, write ONE short, warm sentence (max 20 words) explaining why they might be compatible romantically. Focus on their astrological/Tu Vi compatibility and element synergy, or shared interests.

User 1:
Name: ${user.name}
Bio: ${user.bio}
Interests: ${user.interests.join(", ")}
Astrology: ${JSON.stringify(user.astrologyData || {})}
Preferred System: ${user.preferredSystem || "western"}

User 2:
Name: ${pick.user.name}
Bio: ${pick.user.bio}
Interests: ${pick.user.interests.join(", ")}
Astrology: ${JSON.stringify(pick.user.astrologyData || {})}

Write a brief cosmic match insight:`;

      let aiExplanation = "You two seem like a great match!";

      try {
        aiExplanation = (
          await generateChatCompletion(prompt, {
            maxTokens: 60,
            temperature: 0.8,
          })
        ).trim();
      } catch (error) {
        console.error("Failed to generate AI explanation:", error);
      }

      picksWithExplanations.push({
        pickedUserId: pick.userId,
        score: pick.score,
        aiExplanation,
        sharedInterests,
        status: "pending",
      });
    }

    // Calculate expiry at midnight
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    // Save picks
    await ctx.runMutation(internal.matches.saveDailyPicks, {
      userId: args.userId,
      picks: picksWithExplanations,
      generatedAt: now,
      expiresAt: midnight.getTime(),
    });

    return { success: true, count: picksWithExplanations.length };
  },
});

// Action to handle like/pass on a daily pick (creates swipe + checks for match)
export const actOnDailyPick = action({
  args: {
    userId: v.id("users"),
    pickedUserId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("pass")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ matched: boolean; matchId: Id<"matches"> | null }> => {
    // Get daily picks record
    const dailyPicks = await ctx.runQuery(
      internal.matches.getDailyPicksInternal,
      {
        userId: args.userId,
      },
    );

    if (!dailyPicks) {
      throw new Error("No daily picks found");
    }

    // Update pick status
    await ctx.runMutation(internal.matches.updatePickStatus, {
      dailyPicksId: dailyPicks._id,
      pickedUserId: args.pickedUserId,
      status: args.action === "like" ? "liked" : "passed",
    });

    // If liked, create a swipe (this will also check for mutual match)
    if (args.action === "like") {
      const swipeResult: { matched: boolean; matchId: Id<"matches"> | null } =
        await ctx.runMutation(internal.swipes.createSwipeInternal, {
          swiperId: args.userId,
          swipedId: args.pickedUserId,
          action: "like",
        });

      return swipeResult;
    }

    // If passed, also record as a reject swipe so they don't appear again
    await ctx.runMutation(internal.swipes.createSwipeInternal, {
      swiperId: args.userId,
      swipedId: args.pickedUserId,
      action: "reject",
    });

    return { matched: false, matchId: null };
  },
});
