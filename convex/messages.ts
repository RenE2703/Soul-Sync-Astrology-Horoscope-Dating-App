import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withResolvedPhotos } from "./lib/photos";
import { getAllMatchesForUser, getOtherUserId } from "./lib/utils";

// Get messages for a match
export const getMessages = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_match_and_time", (q) => q.eq("matchId", args.matchId))
      .collect();
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the sender is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    if (match.user1Id !== args.senderId && match.user2Id !== args.senderId) {
      throw new Error("Not authorized to send messages in this match");
    }

    return await ctx.db.insert("messages", {
      matchId: args.matchId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
      read: false,
    });
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
      .filter((q) =>
        q.and(
          q.neq(q.field("senderId"), args.userId),
          q.eq(q.field("read"), false)
        )
      )
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, { read: true });
    }
  },
});

// Get unread message count for a user
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allMatches = await getAllMatchesForUser(ctx, args.userId);

    let unreadCount = 0;

    for (const match of allMatches) {
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_match", (q) => q.eq("matchId", match._id))
        .filter((q) =>
          q.and(
            q.neq(q.field("senderId"), args.userId),
            q.eq(q.field("read"), false),
          ),
        )
        .collect();

      unreadCount += unreadMessages.length;
    }

    return unreadCount;
  },
});

// Get last message for each match (for chat list preview)
export const getMatchesWithLastMessage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allMatches = await getAllMatchesForUser(ctx, args.userId);

    const matchesWithDetails = await Promise.all(
      allMatches.map(async (match) => {
        const otherUserId = getOtherUserId(match, args.userId);
        const otherUser = await ctx.db.get(otherUserId);
        // Resolve photo URLs for the other user
        const otherUserWithPhotos = await withResolvedPhotos(ctx, otherUser);

        const messages = await ctx.db
          .query("messages")
          .withIndex("by_match_and_time", (q) => q.eq("matchId", match._id))
          .order("desc")
          .take(1);

        const lastMessage = messages[0] || null;

        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .filter((q) =>
            q.and(
              q.neq(q.field("senderId"), args.userId),
              q.eq(q.field("read"), false),
            ),
          )
          .collect();

        return {
          ...match,
          otherUser: otherUserWithPhotos,
          lastMessage,
          unreadCount: unreadCount.length,
        };
      }),
    );

    // Sort by last message time or match time
    return matchesWithDetails.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.matchedAt;
      const bTime = b.lastMessage?.createdAt || b.matchedAt;
      return bTime - aTime;
    });
  },
});
