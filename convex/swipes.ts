import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
  query,
} from "./_generated/server";
import { areUsersCompatible } from "./lib/compatibility";
import { getDistanceBetweenUsers } from "./lib/distance";
import { withResolvedPhotos, withResolvedPhotosArray } from "./lib/photos";

// Helper function to create a swipe and check for mutual match
// Used by both createSwipe and createSwipeInternal to avoid code duplication
async function createSwipeAndCheckMatch(
  ctx: MutationCtx,
  args: {
    swiperId: Id<"users">;
    swipedId: Id<"users">;
    action: "like" | "reject";
  },
): Promise<{ matched: boolean; matchId: Id<"matches"> | null }> {
  // Create the swipe
  await ctx.db.insert("swipes", {
    swiperId: args.swiperId,
    swipedId: args.swipedId,
    action: args.action,
    createdAt: Date.now(),
  });

  // If it's a like, check for mutual match
  if (args.action === "like") {
    const reverseSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swipedId).eq("swipedId", args.swiperId),
      )
      .first();

    if (reverseSwipe && reverseSwipe.action === "like") {
      // It's a match! Create match record using internal mutation
      const matchId = await ctx.runMutation(internal.matches.createMatch, {
        user1Id: args.swiperId,
        user2Id: args.swipedId,
      });

      return { matched: true, matchId };
    }
  }

  return { matched: false, matchId: null };
}

// Get a specific swipe (internal)
export const getSwipe = internalQuery({
  args: { swiperId: v.id("users"), swipedId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId),
      )
      .first();
  },
});

// Create a swipe and check for mutual match
export const createSwipe = mutation({
  args: {
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("reject")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ matched: boolean; matchId?: Id<"matches"> }> => {
    // Check if swipe already exists (throw for public API)
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId),
      )
      .first();

    if (existingSwipe) {
      throw new Error("Already swiped on this user");
    }

    // Delegate to shared helper
    const result = await createSwipeAndCheckMatch(ctx, args);
    return {
      matched: result.matched,
      matchId: result.matchId ?? undefined,
    };
  },
});

// Get users who liked you (that you haven't swiped on yet)
export const getLikesReceived = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const likesReceived = await ctx.db
      .query("swipes")
      .withIndex("by_swiped", (q) => q.eq("swipedId", args.userId))
      .filter((q) => q.eq(q.field("action"), "like"))
      .collect();

    // Filter out users we've already swiped on
    const pendingLikes = [];

    for (const like of likesReceived) {
      const ourSwipe = await ctx.db
        .query("swipes")
        .withIndex("by_swiper_and_swiped", (q) =>
          q.eq("swiperId", args.userId).eq("swipedId", like.swiperId),
        )
        .first();

      if (!ourSwipe) {
        const user = await ctx.db.get(like.swiperId);
        if (user) {
          // Resolve photo URLs
          const userWithPhotos = await withResolvedPhotos(ctx, user);
          pendingLikes.push(userWithPhotos);
        }
      }
    }

    return pendingLikes;
  },
});

// Get users to show in swipe feed (haven't been swiped on yet)
// Only fetches a small batch of candidates for efficiency
const FEED_BATCH_SIZE = 5;

export const getSwipeFeed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.userId);
    if (!currentUser) return [];

    // Get all users we've already swiped on
    const ourSwipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", args.userId))
      .collect();

    const swipedIds = new Set(ourSwipes.map((s) => s.swipedId));

    // Stream through users and collect candidates until we have enough
    // This avoids loading all users into memory at once
    const candidates: { user: typeof currentUser; distance: number }[] = [];

    for await (const user of ctx.db.query("users")) {
      // Skip self
      if (user._id === args.userId) continue;

      // Skip already swiped
      if (swipedIds.has(user._id)) continue;

      // Check compatibility (gender, age, distance preferences)
      if (!areUsersCompatible(currentUser, user)) continue;

      // Calculate distance for sorting
      const distance =
        getDistanceBetweenUsers(currentUser.location, user.location) ??
        Infinity;

      // Add to candidates, keeping sorted by distance
      candidates.push({ user, distance });

      // Keep only the closest candidates
      if (candidates.length > FEED_BATCH_SIZE * 2) {
        candidates.sort((a, b) => a.distance - b.distance);
        candidates.length = FEED_BATCH_SIZE;
      }
    }

    // Final sort and trim
    candidates.sort((a, b) => a.distance - b.distance);
    const topCandidates = candidates.slice(0, FEED_BATCH_SIZE);

    // Resolve photo URLs only for the candidates we're returning
    const usersWithPhotos = await withResolvedPhotosArray(
      ctx,
      topCandidates.map((c) => c.user),
    );

    // Add distance to each user
    return usersWithPhotos.map((user, index) => ({
      ...user,
      distance: topCandidates[index].distance,
    }));
  },
});

// Create a swipe internally (used by actions like daily picks)
export const createSwipeInternal = internalMutation({
  args: {
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("reject")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ matched: boolean; matchId: Id<"matches"> | null }> => {
    // Check if swipe already exists (return quietly for internal use)
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId),
      )
      .first();

    if (existingSwipe) {
      // Already swiped, just return without creating duplicate
      return { matched: false, matchId: null };
    }

    // Delegate to shared helper
    return await createSwipeAndCheckMatch(ctx, args);
  },
});
