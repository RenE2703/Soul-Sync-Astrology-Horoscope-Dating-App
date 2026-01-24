import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
    action,
    internalAction,
    internalMutation,
    internalQuery,
    mutation,
    query
} from "./_generated/server";
import { generateEmbedding } from "./lib/openai";
import { withResolvedPhotos } from "./lib/photos";
import { buildProfileText, calculateAge } from "./lib/utils";

// Get user by Clerk ID (with resolved photo URLs)
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return withResolvedPhotos(ctx, user);
  },
});

// Get user by Clerk ID (raw data for editing - photos as storage IDs)
export const getByClerkIdRaw = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID (with resolved photo URLs)
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return withResolvedPhotos(ctx, user);
  },
});

// Internal query to get user (for actions) - raw data without photo resolution
export const getInternal = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Internal query to get user with resolved photos (for actions that need displayable URLs)
export const getInternalWithPhotos = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return withResolvedPhotos(ctx, user);
  },
});

// Create user profile (internal - called after embedding generation)
export const createProfile = internalMutation({
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
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    maxDistance: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const now = Date.now();
    const age = calculateAge(args.dateOfBirth);
    return await ctx.db.insert("users", {
      ...args,
      age, // Computed from dateOfBirth for vector index filtering
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create profile with embedding generation
export const createProfileWithEmbedding = action({
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
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    maxDistance: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    // Combine profile data for embedding
    const profileText = buildProfileText(args.bio, args.interests);

    // Generate embedding using OpenAI
    const embedding: number[] = await generateEmbedding(profileText);

    // Store profile with embedding
    const userId: Id<"users"> = await ctx.runMutation(
      internal.users.createProfile,
      {
        ...args,
        embedding,
      }
    );

    return userId;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()), // Unix timestamp
    gender: v.optional(v.string()),
    bio: v.optional(v.string()),
    lookingFor: v.optional(v.array(v.string())),
    ageRange: v.optional(
      v.object({
        min: v.number(),
        max: v.number(),
      })
    ),
    interests: v.optional(v.array(v.string())),
    photos: v.optional(v.array(v.string())),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    maxDistance: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const { id, dateOfBirth, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    // If dateOfBirth is updated, recalculate age
    const ageUpdate = dateOfBirth !== undefined 
      ? { dateOfBirth, age: calculateAge(dateOfBirth) }
      : {};

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...ageUpdate,
      updatedAt: Date.now(),
    });

    // Schedule embedding regeneration if bio or interests changed
    if (updates.bio !== undefined || updates.interests !== undefined) {
      await ctx.scheduler.runAfter(0, internal.users.updateEmbeddingInternal_action, {
        userId: id,
      });
    }
  },
});

// Internal mutation to update embedding
export const updateEmbeddingInternal = internalMutation({
  args: {
    userId: v.id("users"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.userId, {
      embedding: args.embedding,
      updatedAt: Date.now(),
    });
  },
});

// Internal action to regenerate embedding after profile changes
export const updateEmbeddingInternal_action = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<void> => {
    const user = await ctx.runQuery(internal.users.getInternal, {
      id: args.userId,
    });

    if (!user) throw new Error("User not found");

    const profileText = buildProfileText(user.bio, user.interests);

    const embedding: number[] = await generateEmbedding(profileText);

    await ctx.runMutation(internal.users.updateEmbeddingInternal, {
      userId: args.userId,
      embedding,
    });
  },
});
