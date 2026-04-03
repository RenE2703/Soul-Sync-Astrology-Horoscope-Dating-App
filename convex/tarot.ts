import { v } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { generateChatCompletion } from "./lib/openai";

// ====================================================
// TAROT CARD DATABASE (78-card Rider-Waite deck)
// Each card has: name, image URL, upright meaning, love meaning
// Images from public domain Rider-Waite-Smith deck (1909)
// ====================================================

interface TarotCard {
  name: string;
  image: string;       // Public domain Rider-Waite image URL
  meaning: string;     // General upright meaning
  loveMeaning: string; // Love-specific interpretation
  element: string;     // Associated element/suit element
  keywords: string[];  // Quick keywords for the card
}

const TAROT_DECK: TarotCard[] = [
  // === MAJOR ARCANA (22 cards) ===
  {
    name: "The Fool",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg",
    meaning: "New beginnings, innocence, spontaneity, a free spirit",
    loveMeaning: "A new romantic adventure awaits. Be open to unexpected connections and let go of past baggage.",
    element: "Air",
    keywords: ["new beginnings", "adventure", "innocence", "leap of faith"],
  },
  {
    name: "The Magician",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
    meaning: "Manifestation, resourcefulness, power, inspired action",
    loveMeaning: "You have the power to manifest the love you desire. Take action and use your charm confidently.",
    element: "Mercury",
    keywords: ["manifestation", "willpower", "desire", "creation"],
  },
  {
    name: "The High Priestess",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg",
    meaning: "Intuition, sacred knowledge, divine feminine, the subconscious mind",
    loveMeaning: "Trust your intuition about someone. Deeper feelings are hiding beneath the surface — patience reveals truth.",
    element: "Moon",
    keywords: ["intuition", "mystery", "inner voice", "patience"],
  },
  {
    name: "The Empress",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg",
    meaning: "Femininity, beauty, nature, nurturing, abundance",
    loveMeaning: "Love is blossoming. Embrace sensuality, self-care, and nurturing energy to attract your ideal partner.",
    element: "Venus",
    keywords: ["abundance", "beauty", "fertility", "nurturing"],
  },
  {
    name: "The Emperor",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg",
    meaning: "Authority, structure, control, fatherhood, stability",
    loveMeaning: "Seek stability and commitment. A strong, reliable partner may enter your life — or it's time to be that person.",
    element: "Aries",
    keywords: ["authority", "stability", "protection", "structure"],
  },
  {
    name: "The Hierophant",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg",
    meaning: "Tradition, conformity, morality, spiritual wisdom",
    loveMeaning: "Shared values and traditions matter now. A relationship rooted in common beliefs will thrive.",
    element: "Taurus",
    keywords: ["tradition", "wisdom", "conformity", "shared values"],
  },
  {
    name: "The Lovers",
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg",
    meaning: "Love, harmony, relationships, values alignment, choices",
    loveMeaning: "A significant romantic choice approaches. Follow your heart — deep alignment and soulmate energy surround you.",
    element: "Gemini",
    keywords: ["love", "union", "choices", "harmony"],
  },
  {
    name: "The Chariot",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg",
    meaning: "Control, willpower, success, determination",
    loveMeaning: "Take charge of your love life. Your determination will help you overcome obstacles in romance.",
    element: "Cancer",
    keywords: ["determination", "victory", "control", "willpower"],
  },
  {
    name: "Strength",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
    meaning: "Inner strength, bravery, compassion, patience",
    loveMeaning: "True love requires gentleness and patience. Show vulnerability — it's your greatest strength in relationships.",
    element: "Leo",
    keywords: ["courage", "patience", "compassion", "inner strength"],
  },
  {
    name: "The Hermit",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg",
    meaning: "Soul-searching, introspection, being alone, inner guidance",
    loveMeaning: "Take time for self-reflection before seeking love. Understanding yourself first leads to better connections.",
    element: "Virgo",
    keywords: ["solitude", "reflection", "wisdom", "inner light"],
  },
  {
    name: "Wheel of Fortune",
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg",
    meaning: "Good luck, karma, life cycles, turning point",
    loveMeaning: "A turning point in your love life is near. Destiny is working in your favor — stay open to surprises.",
    element: "Jupiter",
    keywords: ["destiny", "cycles", "luck", "turning point"],
  },
  {
    name: "Justice",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg",
    meaning: "Fairness, truth, cause and effect, law",
    loveMeaning: "Seek balance and honesty in relationships. True love is built on fairness, truth, and mutual respect.",
    element: "Libra",
    keywords: ["truth", "fairness", "balance", "accountability"],
  },
  {
    name: "The Hanged Man",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg",
    meaning: "Surrender, letting go, new perspectives, suspension",
    loveMeaning: "Let go of control in love. Sometimes the best romantic outcomes come from patience and seeing things differently.",
    element: "Neptune",
    keywords: ["surrender", "patience", "new perspective", "release"],
  },
  {
    name: "Death",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg",
    meaning: "Endings, change, transformation, transition",
    loveMeaning: "An old romantic pattern is ending — making space for something beautiful. Embrace transformation in love.",
    element: "Scorpio",
    keywords: ["transformation", "ending", "rebirth", "change"],
  },
  {
    name: "Temperance",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg",
    meaning: "Balance, moderation, patience, finding meaning",
    loveMeaning: "Seek a partner who brings balance to your life. Patience and moderation will lead to harmonious love.",
    element: "Sagittarius",
    keywords: ["balance", "moderation", "harmony", "patience"],
  },
  {
    name: "The Devil",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg",
    meaning: "Shadow self, attachment, addiction, restriction",
    loveMeaning: "Watch out for toxic patterns or unhealthy attachments. Free yourself from relationships that trap you.",
    element: "Capricorn",
    keywords: ["temptation", "bondage", "shadow", "attachment"],
  },
  {
    name: "The Tower",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
    meaning: "Sudden change, upheaval, chaos, revelation",
    loveMeaning: "A sudden revelation or shakeup in love. Though it feels chaotic, it clears the path for something genuine.",
    element: "Mars",
    keywords: ["upheaval", "revelation", "awakening", "liberation"],
  },
  {
    name: "The Star",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg",
    meaning: "Hope, faith, purpose, renewal, spirituality",
    loveMeaning: "Hope and healing shine on your love life. Your soulmate connection is aligning — keep faith.",
    element: "Aquarius",
    keywords: ["hope", "inspiration", "renewal", "serenity"],
  },
  {
    name: "The Moon",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg",
    meaning: "Illusion, fear, anxiety, subconscious, intuition",
    loveMeaning: "Not everything is as it seems in love. Trust your gut feeling and don't ignore red flags.",
    element: "Pisces",
    keywords: ["illusion", "intuition", "fear", "subconscious"],
  },
  {
    name: "The Sun",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg",
    meaning: "Positivity, fun, warmth, success, vitality",
    loveMeaning: "Joy and warmth radiate in your love life! A bright, happy, and playful connection is coming your way.",
    element: "Sun",
    keywords: ["joy", "success", "vitality", "positivity"],
  },
  {
    name: "Judgement",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg",
    meaning: "Judgement, rebirth, inner calling, absolution",
    loveMeaning: "Reflect on past relationships with compassion. A new chapter calls — answer with an open heart.",
    element: "Pluto",
    keywords: ["rebirth", "reflection", "calling", "absolution"],
  },
  {
    name: "The World",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg",
    meaning: "Completion, integration, accomplishment, travel",
    loveMeaning: "A love cycle completes beautifully. You're ready for deep, fulfilling partnership — wholeness attracts wholeness.",
    element: "Saturn",
    keywords: ["completion", "fulfillment", "wholeness", "achievement"],
  },

  // === MINOR ARCANA - CUPS (emotions, love, relationships) ===
  {
    name: "Ace of Cups",
    image: "https://upload.wikimedia.org/wikipedia/commons/3/36/Cups01.jpg",
    meaning: "New feelings, intuition, intimacy, compassion",
    loveMeaning: "A pure new love enters your life. Your heart is overflowing — open it to receive deep emotional connection.",
    element: "Water",
    keywords: ["new love", "emotional awakening", "compassion", "intimacy"],
  },
  {
    name: "Two of Cups",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Cups02.jpg",
    meaning: "Unified love, partnership, mutual attraction",
    loveMeaning: "A beautiful mutual connection is forming. This is the soulmate card — deep reciprocal love energy.",
    element: "Water",
    keywords: ["partnership", "mutual love", "connection", "soulmate"],
  },
  {
    name: "Three of Cups",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Cups03.jpg",
    meaning: "Celebration, friendship, creativity, collaborations",
    loveMeaning: "Love found through social connections. Friends may introduce you to someone special — celebrate community.",
    element: "Water",
    keywords: ["celebration", "friendship", "community", "joy"],
  },
  {
    name: "Ten of Cups",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/84/Cups10.jpg",
    meaning: "Divine love, blissful relationships, harmony, alignment",
    loveMeaning: "The ultimate love card — lasting happiness, family harmony, and a relationship that feels like home.",
    element: "Water",
    keywords: ["happiness", "family", "harmony", "lasting love"],
  },

  // === MINOR ARCANA - SWORDS (intellect, conflict, truth) ===
  {
    name: "Ace of Swords",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Swords01.jpg",
    meaning: "Clarity, breakthrough, new ideas, truth",
    loveMeaning: "Mental clarity about your love life arrives. A breakthrough in understanding what you truly need in a partner.",
    element: "Air",
    keywords: ["clarity", "truth", "breakthrough", "mental power"],
  },
  {
    name: "Three of Swords",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/02/Swords03.jpg",
    meaning: "Heartbreak, suffering, grief, sorrow",
    loveMeaning: "Healing from emotional pain is needed. Acknowledge your feelings — the hurt is temporary, growth is permanent.",
    element: "Air",
    keywords: ["heartbreak", "grief", "healing", "release"],
  },
  {
    name: "Ten of Swords",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords10.jpg",
    meaning: "Painful endings, deep wounds, betrayal, rock bottom",
    loveMeaning: "A painful chapter ends completely. The darkest moment is just before dawn — new love awaits on the other side.",
    element: "Air",
    keywords: ["ending", "rock bottom", "new dawn", "release"],
  },

  // === MINOR ARCANA - WANDS (passion, ambition, energy) ===
  {
    name: "Ace of Wands",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/11/Wands01.jpg",
    meaning: "Inspiration, new opportunities, growth, potential",
    loveMeaning: "A passionate new spark ignites! Creative energy and excitement surround a fresh romantic opportunity.",
    element: "Fire",
    keywords: ["passion", "inspiration", "spark", "new opportunity"],
  },
  {
    name: "Eight of Wands",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Wands08.jpg",
    meaning: "Speed, action, movement, swift change",
    loveMeaning: "Things are moving fast in love! Rapid developments, exciting messages, and quick romantic progress ahead.",
    element: "Fire",
    keywords: ["speed", "movement", "excitement", "momentum"],
  },

  // === MINOR ARCANA - PENTACLES (material, stability, health) ===
  {
    name: "Ace of Pentacles",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Pents01.jpg",
    meaning: "New financial opportunity, manifestation, abundance",
    loveMeaning: "A stable, grounded new love opportunity. This connection has potential for long-term security and growth.",
    element: "Earth",
    keywords: ["opportunity", "stability", "prosperity", "grounding"],
  },
  {
    name: "Ten of Pentacles",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Pents10.jpg",
    meaning: "Wealth, family, legacy, long-term success",
    loveMeaning: "A love that builds a legacy. Think long-term — this connection could lead to family, home, and lasting wealth.",
    element: "Earth",
    keywords: ["legacy", "family", "abundance", "lasting success"],
  },
];

// ====================================================
// QUERIES & MUTATIONS
// ====================================================

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
    cardImage: v.string(),
    cardMeaning: v.string(),
    reading: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tarotReadings", {
      userId: args.userId,
      date: args.date,
      cardName: args.cardName,
      cardImage: args.cardImage,
      cardMeaning: args.cardMeaning,
      reading: args.reading,
    });
  },
});

// ====================================================
// PERSONALIZED AI READING
// ====================================================

// Action to draw a card and generate a deeply personalized reading via Gemini
export const drawDailyCard = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<{
    cardName: string;
    cardImage: string;
    cardMeaning: string;
    reading: string;
  }> => {
    // 1. Get user data
    const user = await ctx.runQuery(api.users.getByClerkIdRaw, { clerkId: args.clerkId });
    if (!user) throw new Error("User not found");

    const todayDate = new Date().toISOString().split("T")[0];

    // Check if already drawn today (prevent duplicate API calls)
    const existingReading: any = await ctx.runQuery(api.tarot.getTodayReading, { clerkId: args.clerkId });
    if (existingReading) {
      return {
        cardName: existingReading.cardName,
        cardImage: existingReading.cardImage || "",
        cardMeaning: existingReading.cardMeaning || "",
        reading: existingReading.reading,
      };
    }

    // 2. Randomly pick a card from the full deck
    const card = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];

    // 3. Build deeply personalized AI prompt using ALL user data
    const systemInstruction = `You are SoulSync's mystical Tarot reader — an ancient soul who blends Western Astrology, Vietnamese Tử Vi, and Tarot wisdom. You give warm, specific, personally relevant readings that feel like they were written just for this one person. Never give generic advice.`;

    // Gather ALL available user context for maximum personalization
    let userProfile = "";

    // Name & basics
    userProfile += `\n- Name: ${user.name}`;
    userProfile += `\n- Age: ${user.age}, Gender: ${user.gender}`;

    // Bio (personality insight)
    if (user.bio) {
      userProfile += `\n- Their self-description: "${user.bio}"`;
    }

    // Interests (lifestyle)
    if (user.interests && user.interests.length > 0) {
      userProfile += `\n- Passions & interests: ${user.interests.join(", ")}`;
    }

    // Astrology data
    if (user.astrologyData) {
      userProfile += `\n- Western Astrology: Sun in ${user.astrologyData.sun}, Moon in ${user.astrologyData.moon}, Rising ${user.astrologyData.rising}`;
      if (user.astrologyData.canChi && user.astrologyData.canChi !== "Ẩn số") {
        userProfile += `\n- Vietnamese Tử Vi: Born year ${user.astrologyData.canChi}, Bản Mệnh ${user.astrologyData.banMenh}`;
      }
    }

    // Preferred system
    userProfile += `\n- Prefers: ${user.preferredSystem === "tuvi" ? "Vietnamese Tử Vi" : "Western Astrology"}`;

    // Dating preferences
    if (user.lookingFor && user.lookingFor.length > 0) {
      userProfile += `\n- Looking for: ${user.lookingFor.join(", ")}`;
    }
    if (user.ageRange) {
      userProfile += `\n- Preferred age range: ${user.ageRange.min}-${user.ageRange.max}`;
    }

    // Deal-breakers (relationship values)
    if (user.dealBreakers) {
      const db = user.dealBreakers;
      const values = [];
      if (db.religion && db.religion !== "Any") values.push(`Religion: ${db.religion}`);
      if (db.familyBackground && db.familyBackground !== "Any") values.push(`Family: ${db.familyBackground}`);
      if (db.politicalView && db.politicalView !== "Any") values.push(`Politics: ${db.politicalView}`);
      if (values.length > 0) {
        userProfile += `\n- Core values (deal-breakers): ${values.join(", ")}`;
      }
    }

    // Today's date context
    const today = new Date();
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];
    const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][today.getMonth()];

    const prompt = `${systemInstruction}

=== USER PROFILE ===
${userProfile}

=== CARD DRAWN ===
Card: "${card.name}"
Element: ${card.element}
General meaning: ${card.meaning}
Love meaning: ${card.loveMeaning}
Keywords: ${card.keywords.join(", ")}

=== TODAY'S CONTEXT ===
Date: ${dayOfWeek}, ${monthName} ${today.getDate()}, ${today.getFullYear()}

=== YOUR TASK ===
Write a personalized 4-5 sentence daily love and energy reading for ${user.name}. Requirements:
1. Reference their specific zodiac/Tử Vi traits and how the card interacts with their cosmic energy
2. Mention at least ONE of their interests or personality traits from their bio
3. Give a concrete, actionable love tip for today (not vague platitudes)
4. If they prefer Tử Vi, weave in Vietnamese cosmic philosophy naturally
5. End with an encouraging, warm closing that feels personal

Write in a mystical but grounded tone — poetic yet practical. Make them feel truly seen.`;

    // 4. Generate personalized reading
    const readingText = await generateChatCompletion(prompt, { maxTokens: 400, temperature: 0.8 });

    // 5. Save to DB (with image and meaning)
    await ctx.runMutation(api.tarot.saveReading, {
      userId: user._id,
      date: todayDate,
      cardName: card.name,
      cardImage: card.image,
      cardMeaning: card.loveMeaning,
      reading: readingText,
    });

    return {
      cardName: card.name,
      cardImage: card.image,
      cardMeaning: card.loveMeaning,
      reading: readingText,
    };
  },
});
