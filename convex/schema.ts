import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table with profile data and embedding for AI matching
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    dateOfBirth: v.optional(v.number()), // Unix timestamp of birth date (optional for legacy data)
    age: v.number(), // Computed from dateOfBirth on write, or stored directly for legacy data
    gender: v.string(),
    bio: v.string(),
    lookingFor: v.array(v.string()), // Genders interested in
    ageRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    interests: v.array(v.string()),
    photos: v.array(v.string()),
    birthTime: v.optional(v.string()), // e.g. "14:30"
    preferredSystem: v.optional(
      v.union(v.literal("western"), v.literal("tuvi"))
    ),
    astrologyData: v.optional(
      v.object({
        sun: v.string(),
        moon: v.string(),
        rising: v.string(),
        canChi: v.string(),
        banMenh: v.string(),
      })
    ),
    embedding: v.optional(v.array(v.float64())), // 768-dim vector from Gemini
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    maxDistance: v.optional(v.number()), // in miles
    dealBreakers: v.optional(
      v.object({
        religion: v.optional(v.string()),           // e.g. "Buddhist", "Christian", "Any"
        familyBackground: v.optional(v.string()),    // e.g. "Traditional", "Modern", "Any"
        politicalView: v.optional(v.string()),       // e.g. "Liberal", "Conservative", "Any"
      })
    ),
    birthLocation: v.optional(v.string()), // e.g. "Ho Chi Minh City" — used for Ascendant calculation
    timezone: v.optional(v.string()), // IANA timezone e.g. "Asia/Ho_Chi_Minh"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"]) // Forces re-sync of 3072-dim index
    .vectorIndex("by_embedding_v3_final", {
      vectorField: "embedding",
      dimensions: 3072,
      filterFields: ["gender", "age"],
    }),

  // Matches table for mutual likes
  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    matchedAt: v.number(),
    aiExplanation: v.optional(v.string()), // LLM-generated explanation
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),

  // Swipes table for tracking likes/rejects
  swipes: defineTable({
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("reject")),
    createdAt: v.number(),
  })
    .index("by_swiper", ["swiperId"])
    .index("by_swiped", ["swipedId"])
    .index("by_swiper_and_swiped", ["swiperId", "swipedId"]),

  // Messages table for chat
  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    read: v.boolean(),
  })
    .index("by_match", ["matchId"])
    .index("by_match_and_time", ["matchId", "createdAt"]),

  // Daily picks for AI-curated matches (3 per day)
  dailyPicks: defineTable({
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
          v.literal("passed")
        ),
      })
    ),
    generatedAt: v.number(),
    expiresAt: v.number(),
  }).index("by_user", ["userId"]),

  // Daily Tarot Readings table
  tarotReadings: defineTable({
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    cardName: v.string(),
    cardImage: v.optional(v.string()),   // Public domain card illustration URL
    cardMeaning: v.optional(v.string()), // Love-specific card interpretation
    reading: v.string(),
  }).index("by_user_and_date", ["userId", "date"]),
});
