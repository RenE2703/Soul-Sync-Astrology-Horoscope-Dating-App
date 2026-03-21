import { mutation } from "./_generated/server";

export const dummy = mutation({
  args: {},
  handler: async (ctx) => {
    return "forced sync 1";
  }
});
