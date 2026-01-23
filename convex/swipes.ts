import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getDistanceBetweenUsers, isWithinDistance } from "./lib/distance";
import { withResolvedPhotos, withResolvedPhotosArray } from "./lib/photos";

// Get a specific swipe (internal)
export const getSwipe = internalQuery({
  args: { swiperId: v.id("users"), swipedId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId)
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
    args
  ): Promise<{ matched: boolean; matchId?: Id<"matches"> }> => {
    // Check if swipe already exists
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId)
      )
      .first();

    if (existingSwipe) {
      throw new Error("Already swiped on this user");
    }

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
          q.eq("swiperId", args.swipedId).eq("swipedId", args.swiperId)
        )
        .first();

      if (reverseSwipe && reverseSwipe.action === "like") {
        // It's a match! Create match record
        const matchId = await ctx.db.insert("matches", {
          user1Id: args.swiperId,
          user2Id: args.swipedId,
          matchedAt: Date.now(),
        });

        return { matched: true, matchId };
      }
    }

    return { matched: false };
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
          q.eq("swiperId", args.userId).eq("swipedId", like.swiperId)
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

    // Get potential matches
    const allUsers = await ctx.db.query("users").collect();

    const potentialMatches = allUsers.filter((user) => {
      // Skip self
      if (user._id === args.userId) return false;

      // Skip already swiped
      if (swipedIds.has(user._id)) return false;

      // Check gender preferences
      if (!currentUser.lookingFor.includes(user.gender)) return false;
      if (!user.lookingFor.includes(currentUser.gender)) return false;

      // Check age preferences
      if (
        user.age < currentUser.ageRange.min ||
        user.age > currentUser.ageRange.max
      )
        return false;
      if (
        currentUser.age < user.ageRange.min ||
        currentUser.age > user.ageRange.max
      )
        return false;

      // Check distance preferences (bidirectional)
      if (!isWithinDistance(currentUser.location, user.location, currentUser.maxDistance)) {
        return false;
      }
      if (!isWithinDistance(user.location, currentUser.location, user.maxDistance)) {
        return false;
      }

      return true;
    });

    // Shuffle and return top 20
    const shuffled = potentialMatches.sort(() => Math.random() - 0.5);
    const topMatches = shuffled.slice(0, 20);
    
    // Resolve photo URLs for all users
    const usersWithPhotos = await withResolvedPhotosArray(ctx, topMatches);
    
    // Add distance to each user
    return usersWithPhotos.map((user) => ({
      ...user,
      distance: getDistanceBetweenUsers(currentUser.location, user.location),
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
    args
  ): Promise<{ matched: boolean; matchId: Id<"matches"> | null }> => {
    // Check if swipe already exists
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId)
      )
      .first();

    if (existingSwipe) {
      // Already swiped, just return without creating duplicate
      return { matched: false, matchId: null };
    }

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
          q.eq("swiperId", args.swipedId).eq("swipedId", args.swiperId)
        )
        .first();

      if (reverseSwipe && reverseSwipe.action === "like") {
        // It's a match! Create match record
        const matchId = await ctx.db.insert("matches", {
          user1Id: args.swiperId,
          user2Id: args.swipedId,
          matchedAt: Date.now(),
        });

        return { matched: true, matchId };
      }
    }

    return { matched: false, matchId: null };
  },
});
