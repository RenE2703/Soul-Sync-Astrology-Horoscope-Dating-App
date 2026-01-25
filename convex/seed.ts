import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation } from "./_generated/server";
import { areUsersCompatible } from "./lib/compatibility";
import { generateEmbedding } from "./lib/openai";
import {
  buildProfileText,
  calculateAge,
  getAllMatchesForUser,
} from "./lib/utils";
import { demoProfiles } from "./sampleData/demoProfiles";

/**
 * =============================================================================
 * SEED DATA UTILITIES
 * =============================================================================
 *
 * CLI COMMANDS:
 *
 * 1. Seed demo profiles (creates 10 fake users with embeddings):
 *    npx convex run seed:seedDemoProfiles
 *
 * 2. Seed swipes for a user (makes demo users like a specific user):
 *    npx convex run seed:seedSwipesForUser '{"clerkId": "user_xxx"}'
 *
 *    With limited likes:
 *    npx convex run seed:seedSwipesForUser '{"clerkId": "user_xxx", "likeCount": 3}'
 *
 * 3. Clear all demo profiles (and their swipes/matches/messages):
 *    npx convex run seed:clearDemoProfiles
 *
 * 4. Clear all swipes (useful for resetting swipe state):
 *    npx convex run seed:clearSwipes
 *
 * 5. Clear daily picks (reset AI matches so they regenerate):
 *    npx convex run seed:clearDailyPicks
 *
 *    For a specific user:
 *    npx convex run seed:clearDailyPicks '{"clerkId": "user_xxx"}'
 *
 * =============================================================================
 */

// Internal mutation to create a demo user
export const createDemoUser = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    dateOfBirth: v.number(), // Unix timestamp
    gender: v.string(),
    bio: v.string(),
    lookingFor: v.array(v.string()),
    ageRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    interests: v.array(v.string()),
    photos: v.array(v.string()),
    embedding: v.array(v.float64()),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    maxDistance: v.optional(v.number()), // undefined = unlimited (no distance filter)
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const now = Date.now();
    const age = calculateAge(args.dateOfBirth);
    // Only include maxDistance if it's defined
    const { maxDistance, ...rest } = args;
    return await ctx.db.insert("users", {
      ...rest,
      age, // Computed from dateOfBirth for vector index filtering
      ...(maxDistance !== undefined && { maxDistance }),
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Seed all demo profiles with embeddings
 * CLI: npx convex run seed:seedDemoProfiles
 */
export const seedDemoProfiles = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; count: number }> => {
    let count = 0;

    for (const profile of demoProfiles) {
      // Generate embedding for profile
      const profileText = buildProfileText(profile.bio, profile.interests);

      let embedding: number[];
      try {
        embedding = await generateEmbedding(profileText);
      } catch (error) {
        console.error(
          `Failed to generate embedding for ${profile.name}`,
          error,
        );
        continue;
      }

      // Create demo user with unique clerkId
      const clerkId = `demo_${profile.name.toLowerCase()}_${Date.now()}`;

      await ctx.runMutation(internal.seed.createDemoUser, {
        ...profile,
        clerkId,
        embedding,
      });

      count++;
      console.log(`Created demo profile: ${profile.name}`);
    }

    return { success: true, count };
  },
});

// Internal mutation to delete all demo users
export const deleteDemoUsers = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deletedCount: number }> => {
    // Find all users with clerkId starting with "demo_"
    const allUsers = await ctx.db.query("users").collect();
    const demoUsers = allUsers.filter((user) =>
      user.clerkId.startsWith("demo_"),
    );

    let deletedCount = 0;
    for (const user of demoUsers) {
      // Delete associated swipes (where user is swiper or swiped)
      const swipesAsSwiper = await ctx.db
        .query("swipes")
        .withIndex("by_swiper", (q) => q.eq("swiperId", user._id))
        .collect();
      const swipesAsSwiped = await ctx.db
        .query("swipes")
        .withIndex("by_swiped", (q) => q.eq("swipedId", user._id))
        .collect();

      for (const swipe of [...swipesAsSwiper, ...swipesAsSwiped]) {
        await ctx.db.delete(swipe._id);
      }

      // Delete associated matches
      const allMatches = await getAllMatchesForUser(ctx, user._id);

      for (const match of allMatches) {
        // Delete messages for this match
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .collect();
        for (const message of messages) {
          await ctx.db.delete(message._id);
        }
        await ctx.db.delete(match._id);
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Clear all demo profiles and their associated data
 * CLI: npx convex run seed:clearDemoProfiles
 */
export const clearDemoProfiles = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; deletedCount: number }> => {
    const result = await ctx.runMutation(internal.seed.deleteDemoUsers, {});
    console.log(`Deleted ${result.deletedCount} demo profiles`);
    return { success: true, deletedCount: result.deletedCount };
  },
});

// Internal mutation to delete all swipes
export const deleteAllSwipes = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deletedCount: number }> => {
    const allSwipes = await ctx.db.query("swipes").collect();

    for (const swipe of allSwipes) {
      await ctx.db.delete(swipe._id);
    }

    return { deletedCount: allSwipes.length };
  },
});

/**
 * Clear all swipes (useful for resetting swipe state during testing)
 * CLI: npx convex run seed:clearSwipes
 */
export const clearSwipes = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; deletedCount: number }> => {
    const result = await ctx.runMutation(internal.seed.deleteAllSwipes, {});
    console.log(`Deleted ${result.deletedCount} swipes`);
    return { success: true, deletedCount: result.deletedCount };
  },
});

// Internal mutation to create a swipe from demo user to target user
export const createDemoSwipe = internalMutation({
  args: {
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("reject")),
  },
  handler: async (ctx, args): Promise<Id<"swipes">> => {
    // Check if swipe already exists
    const existingSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) =>
        q.eq("swiperId", args.swiperId).eq("swipedId", args.swipedId),
      )
      .first();

    if (existingSwipe) {
      return existingSwipe._id;
    }

    return await ctx.db.insert("swipes", {
      swiperId: args.swiperId,
      swipedId: args.swipedId,
      action: args.action,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation to get user by clerkId
export const getUserByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Internal mutation to get all demo users
export const getAllDemoUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.filter((user) => user.clerkId.startsWith("demo_"));
  },
});

/**
 * Seed swipes from demo profiles to a specific user
 * This simulates demo users liking the target user so they can test matching
 *
 * CLI: npx convex run seed:seedSwipesForUser '{"clerkId": "user_xxx"}'
 * With limit: npx convex run seed:seedSwipesForUser '{"clerkId": "user_xxx", "likeCount": 3}'
 */
export const seedSwipesForUser = action({
  args: {
    clerkId: v.string(),
    likeCount: v.optional(v.number()), // How many demo users should like this user (default: all)
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    likesCreated: number;
    targetUserName: string;
    likedBy: string[];
  }> => {
    // Find the target user by their Clerk ID
    const targetUser = await ctx.runMutation(internal.seed.getUserByClerkId, {
      clerkId: args.clerkId,
    });

    if (!targetUser) {
      throw new Error(`User with clerkId "${args.clerkId}" not found`);
    }

    // Get all demo users
    const demoUsers = await ctx.runMutation(internal.seed.getAllDemoUsers, {});

    if (demoUsers.length === 0) {
      throw new Error(
        "No demo users found. Run seedDemoProfiles first to create demo users.",
      );
    }

    // Filter demo users to only those who could potentially match with target user
    const compatibleDemoUsers = demoUsers.filter((demoUser) =>
      areUsersCompatible(demoUser, targetUser),
    );

    // Determine how many likes to create
    const likeCount = args.likeCount ?? compatibleDemoUsers.length;
    const usersToSwipe = compatibleDemoUsers.slice(0, likeCount);

    let likesCreated = 0;
    const likedBy: string[] = [];

    for (const demoUser of usersToSwipe) {
      await ctx.runMutation(internal.seed.createDemoSwipe, {
        swiperId: demoUser._id,
        swipedId: targetUser._id,
        action: "like",
      });

      likesCreated++;
      likedBy.push(demoUser.name);
      console.log(`${demoUser.name} liked ${targetUser.name}`);
    }

    return {
      success: true,
      likesCreated,
      targetUserName: targetUser.name,
      likedBy,
    };
  },
});

// Internal mutation to delete daily picks
export const deleteAllDailyPicks = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<{ deletedCount: number }> => {
    let dailyPicks;

    if (args.userId) {
      // Delete picks for specific user
      const userPicks = await ctx.db
        .query("dailyPicks")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .first();
      dailyPicks = userPicks ? [userPicks] : [];
    } else {
      // Delete all daily picks
      dailyPicks = await ctx.db.query("dailyPicks").collect();
    }

    for (const pick of dailyPicks) {
      await ctx.db.delete(pick._id);
    }

    return { deletedCount: dailyPicks.length };
  },
});

/**
 * Clear daily picks (reset AI matches so they regenerate)
 * CLI: npx convex run seed:clearDailyPicks
 * For specific user: npx convex run seed:clearDailyPicks '{"clerkId": "user_xxx"}'
 */
export const clearDailyPicks = action({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; deletedCount: number; message: string }> => {
    let userId: Id<"users"> | undefined;

    if (args.clerkId) {
      const user = await ctx.runMutation(internal.seed.getUserByClerkId, {
        clerkId: args.clerkId,
      });

      if (!user) {
        throw new Error(`User with clerkId "${args.clerkId}" not found`);
      }

      userId = user._id;
    }

    const result = await ctx.runMutation(internal.seed.deleteAllDailyPicks, {
      userId,
    });

    const message = args.clerkId
      ? `Deleted ${result.deletedCount} daily picks for user`
      : `Deleted ${result.deletedCount} daily picks for all users`;

    console.log(message);
    return { success: true, deletedCount: result.deletedCount, message };
  },
});
