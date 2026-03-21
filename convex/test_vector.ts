import { v } from "convex/values";
import { action } from "./_generated/server";

export const testVectorSearch = action({
  args: { vector: v.array(v.float64()) },
  handler: async (ctx, args) => {
    try {
      const results = await ctx.vectorSearch("users", "by_embedding_v3_final", {
          vector: args.vector,
          limit: 1
      });
      return { success: true, count: results.length };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
});
