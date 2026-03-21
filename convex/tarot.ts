import { v } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { generateChatCompletion } from "./lib/openai";

const TAROT_CARDS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
  // Minor Arcana examples (shortened for brevity, typically 78 cards)
  "Ace of Cups", "Two of Cups", "Three of Cups", "Ten of Cups",
  "Ace of Swords", "Three of Swords", "Ten of Swords",
  "Ace of Wands", "Eight of Wands",
  "Ace of Pentacles", "Ten of Pentacles"
];

// Query to get today's tarot reading for the user
export const getTodayReading = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const reading = await ctx.db
      .query("tarotReadings")
      .withIndex("by_user_and_date", (q) => q.eq("userId", user._id).eq("date", todayDate))
      .first();

    return reading;
  },
});

// Internal mutation to save a reading
export const saveReading = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    cardName: v.string(),
    reading: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tarotReadings", {
      userId: args.userId,
      date: args.date,
      cardName: args.cardName,
      reading: args.reading,
    });
  },
});

// Action to draw a card and generate reading via Gemini
export const drawDailyCard = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<{ cardName: string; reading: string }> => {
    // 1. Get user data
    const user = await ctx.runQuery(api.users.getByClerkIdRaw, { clerkId: args.clerkId });
    if (!user) throw new Error("User not found");

    const todayDate = new Date().toISOString().split("T")[0];

    // Check if already drawn today (prevent duplicate API calls)
    const existingReading: any = await ctx.runQuery(api.tarot.getTodayReading, { clerkId: args.clerkId });
    if (existingReading) return { cardName: existingReading.cardName, reading: existingReading.reading };

    // 2. Randomly pick a card
    const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];

    // 3. Prepare AI Prompt
    const systemInstruction = `You are a mystical Tarot reader and a master of Astrology & Tử Vi.`;
    
    let userContext = `The user is looking for love.`;
    if (user.astrologyData) {
      if (user.preferredSystem === "tuvi") {
         userContext += ` They are born in the year ${user.astrologyData.canChi}, with element ${user.astrologyData.banMenh}.`;
      } else {
         userContext += ` Their Sun sign is ${user.astrologyData.sun}, Moon in ${user.astrologyData.moon}, and Rising ${user.astrologyData.rising}.`;
      }
    }

    const prompt = `${systemInstruction}
${userContext}
Today they drew the Tarot card: "${randomCard}".
Provide a short, mystical, and practical 3-sentence daily love and energy reading based on their drawn card and astrological/tuvi traits.`;

    // 4. Generate reading
    const readingText = await generateChatCompletion(prompt, { maxTokens: 250, temperature: 0.7 });

    // 5. Save to DB
    await ctx.runMutation(api.tarot.saveReading, {
      userId: user._id,
      date: todayDate,
      cardName: randomCard,
      reading: readingText,
    });

    return { cardName: randomCard, reading: readingText };
  },
});
