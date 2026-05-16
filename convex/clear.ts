import { mutation } from "./_generated/server";

export const all = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["users", "matches", "swipes", "messages", "dailyPicks", "tarotReadings"] as const;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const d of docs) {
        await ctx.db.delete(d._id);
      }
    }
    return "Cleared all Database tables successfully!";
  }
});

export const matchesAndSwipes = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["matches", "swipes"] as const;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const d of docs) {
        await ctx.db.delete(d._id);
      }
    }
    return "Cleared all matches and swipes successfully!";
  }
});
