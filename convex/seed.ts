import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation } from "./_generated/server";
import { generateEmbedding } from "./lib/openai";

const CELEBS = [
  "Ninh Dương Lan Ngọc", "Bích Phương", "Chi Pu", "Hồ Ngọc Hà", "Tóc Tiên", 
  "Đông Nhi", "Min", "Hương Giang", "Phí Phương Anh", "Hoa hậu H’Hen Niê", 
  "Salim", "Thúy Ngân", "Ngọc Trinh", "Linh Ka", "Miu Lê", 
  "Lynk Lee", "Hòa Minzy", "Nguyễn Thúc Thùy Tiên", "Lyly", "Diệu Nhi", 
  "AMEE", "Khả Ngân", "Tlinh", "Phương Ly", "Phương Mỹ Chi", 
  "Cô em Trendy", "Mai Ngô", "Cháu Bùi", "Quỳnh Anh Shyn", "Helly Tống", 
  "Amandine", "Dương Minh Ngọc", "Naomi Roestel", "Khánh Vy", "Jenny Huỳnh", 
  "Vừng", "Nguyễn Lâm Thảo Tâm", "Meichan", "Hannah Olala", "Luna Đào", 
  "An Phương", "Thảo Nhi Lê", "Changmakeup", "Trinh Phạm", "Chloe Nguyễn", 
  "Giang Ơi", "Thạch Trang", "Sunhuyn", "Liêu Hà Trinh", "Lê Hà Trúc", 
  "Cao Thiên Trang", "Nhị Đặng", "Phượng Đi Đâu", "No Food Phobia", "Phan Anh (Esheep)", 
  "Ciin", "Đào Lê Phương Hoa", "Việt Phương Thoa", "Trà Đặng", "Hot girl Chao", 
  "Gấm Kami", "Xoài Phạm", "Cindy", "Ngô Ngọc Hòa", "Lê Bống", 
  "Linh Ngọc Đàm", "Linda Ngo", "Đặng Thu Hà", "Tín Nguyễn", "Hiền Hồ", 
  "Bảo Anh", "Văn Mai Hương", "Suni Hạ Linh", "Han Sara", "Juky San", 
  "Hoàng Yến Chibi", "Kaity Nguyễn", "Jun Vũ", "Midu", "Sam", 
  "Puka", "Hari Won", "Khởi My", "Minh Hằng", "Thủy Tiên", 
  "Elly Trần", "Tâm Tít", "Huyền Baby", "Hạnh Sino", "Emily", 
  "Suboi", "Kimmese", "Orange", "Sofia", "Pháo", 
  "Lona Kiều Loan", "Trần Thanh Tâm", "Lê Thụy", "Trang Hý", "Mỹ Tâm", 
  "Sơn Tùng M-TP", "Đen Vâu", "MONO", "Binz", "Karik", "HIEUTHUHAI", "Isaac"
];

const ARCHETYPES = [
  {
    bio: "Mẫu người hiện đại, đam mê thời trang và luôn muốn dẫn đầu xu hướng. Thích những buổi cafe chill và chụp ảnh nghệ thuật. Gu của mình là những chàng trai lịch thiệp, có phong cách.",
    interests: ["Thời trang", "Nhiếp ảnh", "Cafehopping", "High-end Brand", "Shopping"],
    gender: "woman",
    lookingFor: ["man"],
    system: "western" as const
  },
  {
    bio: "Nghệ sĩ tự do với tâm hồn bay bổng. Yêu âm nhạc Indie, thích vẽ tranh và những gì hoài cổ. Mong tìm được một 'soulmate' để cùng đi triển lãm mỗi cuối tuần.",
    interests: ["Vẽ tranh", "Indie Music", "Lâm Đồng", "Đồ si", "Sách"],
    gender: "woman",
    lookingFor: ["man", "woman"],
    system: "tuvi" as const
  },
  {
    bio: "Girl hành động, yêu gym/yoga và lối sống healthy. Luôn dồi dào năng lượng tích cực. Cùng mình đi trekking hay chạy bộ buổi sáng nhé!",
    interests: ["Gym", "Yoga", "Healthy food", "Chạy bộ", "Trekking"],
    gender: "woman",
    lookingFor: ["man"],
    system: "western" as const
  },
  {
    bio: "Foodie chính hiệu, thích khám phá mọi ngóc ngách ẩm thực Sài Gòn/Hà Nội. Nấu ăn cũng là một thế mạnh của mình. Đang tìm người cùng mình đi ăn cả thế giới.",
    interests: ["Ẩm thực", "Nấu ăn", "Review món ăn", "Du lịch tâm linh", "Phim ảnh"],
    gender: "woman",
    lookingFor: ["man"],
    system: "tuvi" as const
  },
  {
    bio: "Gen Z sành điệu, đam mê công nghệ và gaming. Một chút bướng bỉnh nhưng lại rất tình cảm. Thích những người thông minh và hài hước.",
    interests: ["Gaming", "Công nghệ", "AI", "Startup", "Tiktok"],
    gender: "woman",
    lookingFor: ["man"],
    system: "western" as const
  },
  {
    bio: "Tín đồ 'xê dịch', đi đây đi đó để mở mang tầm mắt. Thích cuộc sống tự do, không gò bó. Gu mình là những người có cùng đam mê khám phá.",
    interests: ["Du lịch bụi", "Outdoor", "Camping", "Văn hóa", "Ngoại ngữ"],
    gender: "woman",
    lookingFor: ["man", "woman"],
    system: "western" as const
  },
  {
    bio: "Mộc mạc nhưng sâu sắc. Thích tìm hiểu về cung hoàng đạo, tử vi và thiền định. Đang tìm kiếm sự bình yên trong tâm hồn giữa thế giới ồn ào.",
    interests: ["Tâm linh", "Thiền", "Tử vi", "Healing", "Trà đạo"],
    gender: "woman",
    lookingFor: ["man"],
    system: "tuvi" as const
  },
  {
    bio: "Nữ doanh nhân bận rộn nhưng luôn biết cách tận hưởng cuộc sống. Thích wine, jazz và những cuộc trò chuyện sâu sắc. Tìm một bờ vai vững chãi.",
    interests: ["Kinh doanh", "Wine", "Jazz", "Đầu tư", "Networking"],
    gender: "woman",
    lookingFor: ["man"],
    system: "western" as const
  },
  {
    bio: "Năng động, thích tham gia các hoạt động xã hội và cộng đồng. Một trái tim ấm áp luôn hướng tới những điều tốt đẹp.",
    interests: ["Từ thiện", "Môi trường", "Social Work", "Âm nhạc cộng đồng", "Thú cưng"],
    gender: "woman",
    lookingFor: ["man"],
    system: "western" as const
  },
  {
    bio: "Cô gái của gia đình, truyền thống nhưng không kém phần hiện đại. Biết chăm sóc bản thân và những người xung quanh. Thích sự chân thành.",
    interests: ["Làm vườn", "Cắm hoa", "Trang trí nhà cửa", "Phim gia đình", "Handmade"],
    gender: "woman",
    lookingFor: ["man"],
    system: "tuvi" as const
  },
  {
    bio: "Nam ca sĩ, rapper tài năng, thích những gì ngầu và phong cách. Luôn cháy hết mình với âm nhạc. Tìm kiếm một cô gái cá tính và hiểu mình.",
    interests: ["Rapping", "Hiphop", "Sneakers", "Sản xuất nhạc", "Sân khấu"],
    gender: "man",
    lookingFor: ["woman"],
    system: "western" as const
  },
  {
    bio: "Diễn viên, người dẫn chương trình với tính cách vui vẻ, hoạt bát. Luôn làm mọi người cười. Thích những gì chân thật và giản dị nhất.",
    interests: ["Sân khấu", "Hài hước", "Mc", "Nấu ăn", "Du lịch"],
    gender: "man",
    lookingFor: ["woman"],
    system: "tuvi" as const
  }
];

export const seedCelebs = action({
  args: {},
  handler: async (ctx) => {
    console.log("Starting premium seed process for ~100 celebs...");
    
    // 1. Generate embeddings for archetypes (12 calls)
    const archetypeEmbeddings = [];
    for (const arch of ARCHETYPES) {
      const text = `${arch.bio} Interests: ${arch.interests.join(", ")}`;
      console.log(`Generating embedding for archetype...`);
      const embedding = await generateEmbedding(text);
      if (embedding.length !== 3072) {
          throw new Error(`CRITICAL: Generated embedding has ${embedding.length} dimensions, expected 3072. Check schema override!`);
      }
      archetypeEmbeddings.push(embedding);
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log("Embeddings generated. Dimensions confirmed as 3072. Batching inserts...");

    const usersToInsert = [];
    for (let i = 0; i < CELEBS.length; i++) {
        const archIdx = i % ARCHETYPES.length;
        const arch = ARCHETYPES[archIdx];
        const embedding = archetypeEmbeddings[archIdx];
        
        const age = Math.floor(Math.random() * 18) + 19; // 19 - 37
        const birthYear = new Date().getFullYear() - age;
        const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).getTime();

        let bio = arch.bio;
        // Personalize bios for specific famous ones
        if (CELEBS[i] === "Ninh Dương Lan Ngọc") bio = "Ngọc nữ màn ảnh Việt với nụ cười tỏa nắng. Yêu thích yoga, nấu ăn và luôn sống hết mình với đam mê diễn xuất. Mong tìm được người đàn ông ấm áp.";
        if (CELEBS[i] === "Bích Phương") bio = "Lầy lội, hài hước nhưng cực kỳ sâu sắc trong âm nhạc. Thích ngủ nướng, ăn quà vặt và tìm kiếm sự đồng điệu. Bạn có muốn cùng mình đi ăn vặt không?";
        if (CELEBS[i] === "Chi Pu") bio = "Năng động, thích thử thách bản thân với vũ đạo và thời trang. Luôn không ngừng nỗ lực để tỏa sáng. Mình đang tìm một người bạn đồng hành cùng gu.";
        if (CELEBS[i] === "H'Hen Niê") bio = "Yêu đời, yêu thiên nhiên và luôn tràn đầy năng lượng tích cực từ núi rừng Tây Nguyên. Mong muốn lan tỏa yêu thương đến cộng đồng.";
        if (CELEBS[i] === "Sơn Tùng M-TP") bio = "Cháy hết mình với âm nhạc và sáng tạo. Thích sự khác biệt và luôn hướng về phía trước. Tìm kiếm một tâm hồn đồng điệu.";
        if (CELEBS[i] === "Đen Vâu") bio = "Rapper của những tâm hồn tự do. Thích cuộc sống giản dị, về quê nuôi cá và trồng thêm rau. Bạn có muốn về quê cùng mình không?";

        usersToInsert.push({
            clerkId: `seed_clerk_${i}_${Date.now()}`,
            name: CELEBS[i],
            dateOfBirth,
            age,
            gender: arch.gender,
            bio: bio,
            lookingFor: arch.lookingFor,
            ageRange: { min: 18, max: 50 },
            interests: arch.interests,
            photos: [`https://i.pravatar.cc/600?img=${(i % 70) + 1}`],
            preferredSystem: arch.system,
            embedding,
            birthTime: "12:00am",
            astrologyData: {
              sun: getSunSign(new Date(dateOfBirth).getMonth() + 1, new Date(dateOfBirth).getDate()),
              moon: "Unknown",
              rising: "Unknown",
              canChi: "Unknown",
              banMenh: "Unknown",
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    const chunkSize = 20;
    for (let i = 0; i < usersToInsert.length; i += chunkSize) {
        const chunk = usersToInsert.slice(i, i + chunkSize);
        await ctx.runMutation(internal.seed.batchInsertUsers, { users: chunk });
        console.log(`Inserted ${i + chunk.length}/${usersToInsert.length} celebs...`);
    }

    return `Successfully seeded ${usersToInsert.length} Vietnamese celebrities with 3072-dim vectors!`;
  },
});

export const batchInsertUsers = internalMutation({
    args: {
        users: v.array(v.any())
    },
    handler: async (ctx, args) => {
        for (const user of args.users) {
            await ctx.db.insert("users", user);
        }
    }
});

// Internal query: get all users for backfill (WARNING: returns full objects including 32MB embeddings, DO NOT USE for bulk actions)
export const getAllUsersInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Internal query: get lightweight user data for backfill (excluding embeddings)
export const getUsersForBackfill = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      _id: u._id,
      name: u.name,
      dateOfBirth: u.dateOfBirth,
      birthTime: u.birthTime,
      birthLocation: u.birthLocation,
      location: u.location,
    }));
  },
});

// Internal mutation: patch a single user's astrology data
export const patchUserAstrology = internalMutation({
  args: {
    userId: v.id("users"),
    astrologyData: v.object({
      sun: v.string(),
      moon: v.string(),
      rising: v.string(),
      canChi: v.string(),
      banMenh: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      astrologyData: args.astrologyData,
      updatedAt: Date.now(),
    });
  },
});

// Vietnamese → English zodiac name mapping (for fixing seed data)
const VN_TO_EN_ZODIAC: Record<string, string> = {
  "Bạch Dương (Aries)": "Aries",
  "Kim Ngưu (Taurus)": "Taurus",
  "Song Tử (Gemini)": "Gemini",
  "Cự Giải (Cancer)": "Cancer",
  "Sư Tử (Leo)": "Leo",
  "Xử Nữ (Virgo)": "Virgo",
  "Thiên Bình (Libra)": "Libra",
  "Bọ Cạp (Scorpio)": "Scorpio",
  "Nhân Mã (Sagittarius)": "Sagittarius",
  "Ma Kết (Capricorn)": "Capricorn",
  "Bảo Bình (Aquarius)": "Aquarius",
  "Song Ngư (Pisces)": "Pisces",
};

/**
 * Quick fix: patches all users with Vietnamese zodiac names to English,
 * and fills "Unknown" moon/rising with the sun sign as fallback.
 * This is instant and doesn't call any external APIs.
 */
export const fixMissingData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let count = 0;
    for (const user of users) {
      const updates: any = {};
      
      if (!user.birthTime) {
        updates.birthTime = "12:00";
      }
      
      if (user.astrologyData) {
        let needsFix = false;
        const astro = { ...user.astrologyData };
        
        // Fix Vietnamese sun sign names → English
        if (VN_TO_EN_ZODIAC[astro.sun]) {
          astro.sun = VN_TO_EN_ZODIAC[astro.sun];
          needsFix = true;
        }
        if (VN_TO_EN_ZODIAC[astro.moon]) {
          astro.moon = VN_TO_EN_ZODIAC[astro.moon];
          needsFix = true;
        }
        if (VN_TO_EN_ZODIAC[astro.rising]) {
          astro.rising = VN_TO_EN_ZODIAC[astro.rising];
          needsFix = true;
        }

        // Fill "Unknown" moon/rising with sun sign as fallback
        if (astro.moon === "Unknown" || !astro.moon) {
          astro.moon = astro.sun;
          needsFix = true;
        }
        if (astro.rising === "Unknown" || !astro.rising) {
          astro.rising = astro.sun;
          needsFix = true;
        }

        if (needsFix) {
          updates.astrologyData = astro;
        }
      } else {
        // No astrology data at all — create from dateOfBirth
        const date = new Date(user.dateOfBirth || 0);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const sign = getSunSign(month, day);
        // Convert to English if needed
        const englishSign = VN_TO_EN_ZODIAC[sign] || sign;

        updates.astrologyData = {
          sun: englishSign,
          moon: englishSign,
          rising: englishSign,
          canChi: "Ẩn số",
          banMenh: "Ẩn số",
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
        count++;
      }
    }
    return `Fixed data for ${count} users.`;
  }
});

/**
 * Full backfill: uses CircularNatalHoroscopeJS to compute proper
 * Western astrology + Vietnamese Tử Vi for users with missing/incomplete data.
 * 
 * Run this from the Convex dashboard:
 *   npx convex run seed:backfillAstrologyData
 */
export const backfillAstrologyData = action({
  args: {},
  handler: async (ctx) => {
    // Step 1: Quick fix — convert Vietnamese names and fill Unknown fields instantly
    await ctx.runMutation(internal.seed.fixMissingData);
    console.log("Step 1: Quick fix complete (VN names → EN, Unknown → fallback)");

    // Step 2: Full API backfill for users with placeholder Tử Vi data
    const { calculateAstrologyData } = await import("./lib/astrology");

    const allUsers: any[] = await ctx.runQuery(internal.seed.getAllUsersInternal);
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of allUsers) {
      const astro = user.astrologyData;
      
      // Skip if already has real Tử Vi data (not "Ẩn số" / "Unknown")
      const hasRealTuVi = astro?.canChi && astro.canChi !== "Ẩn số" && astro.canChi !== "Unknown";
      
      if (hasRealTuVi) {
        skipped++;
        continue;
      }

      try {
        console.log(`Backfilling astrology for: ${user.name} (${user._id})`);
        const newAstro = await calculateAstrologyData(
          user.dateOfBirth,
          user.birthTime || "12:00"
        );
        
        await ctx.runMutation(internal.seed.patchUserAstrology, {
          userId: user._id,
          astrologyData: newAstro,
        });
        
        updated++;
        
        // Rate limit: 3 users between pauses
        if (updated % 3 === 0) {
          console.log(`  Progress: ${updated} updated, ${skipped} skipped...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (error) {
        console.error(`Failed for ${user.name}:`, error);
      }
    }
    
    return `Backfill complete! Updated: ${updated}, Skipped (already had data): ${skipped}, Total: ${allUsers.length}`;
  },
});

/**
 * FULL RECALCULATION: Uses the new CircularNatalHoroscopeJS engine to 
 * recalculate astrology data for ALL users without exception.
 * 
 * This PATCHES existing user documents — no data is deleted.
 * Only the `astrologyData` field is updated with accurate Sun/Moon/Rising/CanChi/BanMenh.
 * 
 * Run after switching to CircularNatalHoroscopeJS:
 *   npx convex run seed:recalculateAllAstrology
 */
export const recalculateAllAstrology = action({
  args: {},
  handler: async (ctx) => {
    const { calculateAstrologyData } = await import("./lib/astrology");
    const allUsers: any[] = await ctx.runQuery(internal.seed.getUsersForBackfill);
    
    console.log(`Starting full recalculation for ${allUsers.length} users using CircularNatalHoroscopeJS...`);
    
    let updated = 0;
    let failed = 0;
    
    for (const user of allUsers) {
      try {
        const newAstro = await calculateAstrologyData(
          user.dateOfBirth || 0,
          user.birthTime || "12:00",
          user.birthLocation || "Ho Chi Minh City",
          user.location?.latitude || 10.8231,
          user.location?.longitude || 106.6297
        );
        
        await ctx.runMutation(internal.seed.patchUserAstrology, {
          userId: user._id,
          astrologyData: newAstro,
        });
        
        updated++;
        
        if (updated % 5 === 0) {
          console.log(`  Progress: ${updated}/${allUsers.length} recalculated...`);
        }
        
        // Small delay to yield to the event loop
        await new Promise(r => setTimeout(r, 50));
      } catch (error) {
        failed++;
        console.error(`Failed for ${user.name} (${user._id}):`, error);
      }
    }
    
    return `Recalculation complete! Updated: ${updated}, Failed: ${failed}, Total: ${allUsers.length}`;
  },
});

function getSunSign(month: number, day: number): string {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Bảo Bình (Aquarius)";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Song Ngư (Pisces)";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Bạch Dương (Aries)";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Kim Ngưu (Taurus)";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Song Tử (Gemini)";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cự Giải (Cancer)";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Sư Tử (Leo)";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Xử Nữ (Virgo)";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Thiên Bình (Libra)";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Bọ Cạp (Scorpio)";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Nhân Mã (Sagittarius)";
  return "Ma Kết (Capricorn)";
}


export const migrateGenders = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let count = 0;
    for (const user of users) {
      let updated = false;
      const updates: any = {};
      
      if (user.gender === "male") {
        updates.gender = "man";
        updated = true;
      } else if (user.gender === "female") {
        updates.gender = "woman";
        updated = true;
      }
      
      if (user.lookingFor.includes("male") || user.lookingFor.includes("female")) {
        updates.lookingFor = user.lookingFor.map(g => {
          if (g === "male") return "man";
          if (g === "female") return "woman";
          return g;
        });
        updated = true;
      }
      
      if (updated) {
        await ctx.db.patch(user._id, updates);
        count++;
      }
    }
    return `Migrated ${count} users to man/woman format.`;
  }
});
