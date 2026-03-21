import { query } from "./_generated/server";
import { v } from "convex/values";

export const checkCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) return null;

    const allUsers = await ctx.db.query("users").collect();
    const potentialMatches = allUsers.filter(u => u._id !== user._id);
    
    // Check compatibility breakdown
    const compatibility = potentialMatches.slice(0, 5).map(u => ({
        name: u.name,
        gender_match: user.lookingFor.includes(u.gender) && u.lookingFor.includes(user.gender),
        age_match: (u.age >= user.ageRange.min && u.age <= user.ageRange.max) && (user.age >= u.ageRange.min && user.age <= u.ageRange.max),
        user_lookingFor: user.lookingFor,
        u_gender: u.gender,
        u_lookingFor: u.lookingFor,
        user_gender: user.gender
    }));

    return {
        user,
        compatibility
    };
  }
});
