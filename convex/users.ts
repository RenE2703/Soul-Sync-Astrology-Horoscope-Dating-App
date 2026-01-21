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
import { withResolvedPhotos } from "./lib/photos";

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
    age: v.number(),
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
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      ...args,
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
    age: v.number(),
    gender: v.string(),
    bio: v.string(),
    lookingFor: v.array(v.string()),
    ageRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    interests: v.array(v.string()),
    photos: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    // Combine profile data for embedding
    const profileText: string = `${args.bio} Interests: ${args.interests.join(", ")}`;

    // Generate embedding using OpenAI
    const response: Response = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: profileText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: { data: { embedding: number[] }[] } = await response.json();
    const embedding: number[] = data.data[0].embedding;

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
  },
  handler: async (ctx, args): Promise<void> => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
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

    const profileText: string = `${user.bio} Interests: ${user.interests.join(", ")}`;

    const response: Response = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: profileText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: { data: { embedding: number[] }[] } = await response.json();
    const embedding: number[] = data.data[0].embedding;

    await ctx.runMutation(internal.users.updateEmbeddingInternal, {
      userId: args.userId,
      embedding,
    });
  },
});
