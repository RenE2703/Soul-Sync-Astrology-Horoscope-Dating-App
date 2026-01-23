/**
 * Demo profiles for seeding the database
 * Using specific Unsplash photo IDs to ensure each profile has photos of the same model
 */

export interface DemoProfileBase {
  name: string;
  dateOfBirth: number; // Unix timestamp
  gender: string;
  bio: string;
  lookingFor: string[];
  ageRange: { min: number; max: number };
  interests: string[];
  photos: string[];
}

export interface DemoProfile extends DemoProfileBase {
  location: { latitude: number; longitude: number };
  maxDistance?: number; // undefined = unlimited (no distance filter)
}

/**
 * Helper to convert age to an approximate dateOfBirth timestamp
 * Uses a random month/day for variety
 */
function ageToDateOfBirth(age: number): number {
  const now = new Date();
  const birthYear = now.getFullYear() - age;
  // Random month (0-11) and day (1-28) for variety
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day).getTime();
}

// San Francisco Bay Area locations - spread around the city
const sfLocations = [
  { latitude: 37.7858, longitude: -122.4064 }, // Union Square (near simulator)
  { latitude: 37.7879, longitude: -122.4074 }, // Downtown SF
  { latitude: 37.7849, longitude: -122.4094 }, // Powell St
  { latitude: 37.7899, longitude: -122.4044 }, // North Beach
  { latitude: 37.7949, longitude: -122.3994 }, // Embarcadero
  { latitude: 37.7799, longitude: -122.4144 }, // Civic Center
  { latitude: 37.7749, longitude: -122.4194 }, // Hayes Valley
  { latitude: 37.7699, longitude: -122.4294 }, // Mission Dolores
  { latitude: 37.7599, longitude: -122.4194 }, // Mission District
  { latitude: 37.7549, longitude: -122.4144 }, // Castro
  { latitude: 37.7649, longitude: -122.4094 }, // Noe Valley
  { latitude: 37.8049, longitude: -122.4194 }, // Fisherman's Wharf
  { latitude: 37.8099, longitude: -122.4294 }, // Marina
  { latitude: 37.7999, longitude: -122.4394 }, // Pacific Heights
  { latitude: 37.7749, longitude: -122.3894 }, // SOMA
  { latitude: 37.7449, longitude: -122.4394 }, // Bernal Heights
  { latitude: 37.7399, longitude: -122.3994 }, // Potrero Hill
  { latitude: 37.7649, longitude: -122.4594 }, // Sunset
  { latitude: 37.7349, longitude: -122.4194 }, // Glen Park
  { latitude: 37.7299, longitude: -122.4094 }, // Excelsior
];

// Max distances in miles - bigger steps, undefined = unlimited (no distance filter)
const maxDistances: (number | undefined)[] = [
  10, 25, 50, 100, undefined,  // 5 options cycling through profiles
  25, 50, 100, undefined, 10,
  50, 100, undefined, 10, 25,
  100, undefined, 10, 25, 50,
  undefined, 10, 25, 50, 100,
  10, 25, 50, 100, undefined,
  25, 50, 100, undefined, 10,
  50, 100, undefined, 10, 25,
  100, undefined, 10, 25, 50,
  undefined, 10, 25, 50, 100,
];

const baseProfiles: DemoProfileBase[] = [
  // ============================================================================
  // WOMEN PROFILES
  // ============================================================================
  {
    name: "Sophia",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "woman",
    bio: "Yoga instructor who loves hiking and sunset photography. Fluent in three languages and always planning my next adventure. Looking for someone who values wellness and spontaneous road trips.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 24, max: 35 },
    interests: ["Yoga", "Photography", "Hiking", "Travel", "Coffee", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Luna",
    dateOfBirth: ageToDateOfBirth(24),
    gender: "woman",
    bio: "Art curator with a passion for contemporary design. Weekend farmer's market enthusiast and amateur baker. I believe in meaningful conversations over great wine.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 22, max: 30 },
    interests: ["Art", "Fashion", "Wine", "Cooking", "Movies", "Fashion"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Aria",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "woman",
    bio: "Pastry chef with dreams of opening my own café. Love experimenting with flavors and hosting dinner parties. Looking for someone who appreciates good food and better company.",
    lookingFor: ["man"],
    ageRange: { min: 25, max: 38 },
    interests: ["Cooking", "Cooking", "Travel", "Wine", "Foodie", "Nature"],
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Mia",
    dateOfBirth: ageToDateOfBirth(25),
    gender: "woman",
    bio: "Physical therapist who believes in active living. Trail running, yoga, and beach volleyball are my jam. Looking for a partner in crime for outdoor adventures and cozy movie nights.",
    lookingFor: ["man"],
    ageRange: { min: 24, max: 34 },
    interests: ["Fitness", "Yoga", "Sports", "Movies", "Movies", "Beach"],
    photos: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Zoe",
    dateOfBirth: ageToDateOfBirth(23),
    gender: "woman",
    bio: "Graphic designer with a love for vintage aesthetics. Thrift shopping queen, vinyl collector, and aspiring DJ. Looking for someone who appreciates art and doesn't take life too seriously.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 21, max: 30 },
    interests: ["Art", "Music", "Fashion", "Music", "Dancing", "Art"],
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Isabella",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "woman",
    bio: "Marketing director who secretly writes poetry. Love spontaneous weekend getaways, trying new restaurants, and dancing salsa. Looking for someone who can keep up with my energy.",
    lookingFor: ["man"],
    ageRange: { min: 26, max: 36 },
    interests: ["Dancing", "Travel", "Foodie", "Reading", "Music", "Wine"],
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Emma",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "woman",
    bio: "Environmental lawyer fighting for our planet. When I'm not in court, I'm hiking with my rescue dog or tending to my urban garden. Seeking someone who cares about making a difference.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 27, max: 40 },
    interests: ["Nature", "Hiking", "Pets", "Reading", "Nature", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Olivia",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "woman",
    bio: "Pediatric nurse with an infectious laugh. Love game nights, true crime podcasts, and making the perfect cup of tea. Looking for someone kind who appreciates the little things.",
    lookingFor: ["man"],
    ageRange: { min: 24, max: 34 },
    interests: ["Reading", "Gaming", "Coffee", "Movies", "Pets", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1551292831-023188e78222?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Ava",
    dateOfBirth: ageToDateOfBirth(24),
    gender: "woman",
    bio: "Aspiring actress and part-time barista. Obsessed with classic films, live theater, and discovering hidden speakeasies. Looking for someone who loves adventure and good conversation.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 22, max: 32 },
    interests: ["Movies", "Art", "Coffee", "Dancing", "Music", "Fashion"],
    photos: [
      "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Charlotte",
    dateOfBirth: ageToDateOfBirth(31),
    gender: "woman",
    bio: "Interior designer who turns houses into homes. Weekend antique hunter and amateur photographer. Seeking someone with good taste who appreciates beautiful spaces.",
    lookingFor: ["man"],
    ageRange: { min: 28, max: 42 },
    interests: ["Art", "Photography", "Fashion", "Travel", "Wine", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1557555187-23d685287bc3?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Amelia",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "woman",
    bio: "Data scientist who speaks fluent Python and sarcasm. Love board game nights, craft cocktails, and heated debates about the best pizza in the city. Looking for a witty partner.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 25, max: 35 },
    interests: ["Gaming", "Coffee", "Foodie", "Reading", "Music", "Movies"],
    photos: [
      "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Harper",
    dateOfBirth: ageToDateOfBirth(25),
    gender: "woman",
    bio: "Elementary school teacher who believes in making learning fun. Love camping, country music, and perfecting my grandmother's recipes. Looking for someone genuine and family-oriented.",
    lookingFor: ["man"],
    ageRange: { min: 24, max: 35 },
    interests: ["Cooking", "Music", "Nature", "Hiking", "Reading", "Pets"],
    photos: [
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1513379733131-47fc74b45fc7?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Evelyn",
    dateOfBirth: ageToDateOfBirth(30),
    gender: "woman",
    bio: "Freelance writer and travel blogger. 40 countries and counting! Love local food, sunset chasing, and meaningful connections. Looking for a fellow adventurer to explore with.",
    lookingFor: ["man"],
    ageRange: { min: 27, max: 40 },
    interests: ["Travel", "Photography", "Foodie", "Reading", "Hiking", "Beach"],
    photos: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Abigail",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "woman",
    bio: "ER doctor who needs someone to help me decompress. Love spicy food, stand-up comedy, and spontaneous karaoke. Looking for someone who doesn't mind my unpredictable schedule.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 26, max: 38 },
    interests: ["Music", "Foodie", "Movies", "Dancing", "Travel", "Fitness"],
    photos: [
      "https://images.unsplash.com/photo-1559893088-c0787ebfc084?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1508243529287-e21914733111?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Ella",
    dateOfBirth: ageToDateOfBirth(23),
    gender: "woman",
    bio: "Fashion merchandising student with an eye for style. Love vintage shopping, making mood boards, and discovering new music. Looking for someone creative with their own unique vibe.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 21, max: 28 },
    interests: ["Fashion", "Music", "Art", "Photography", "Dancing", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1536896407451-6e3dd976edd1?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Sofia",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "woman",
    bio: "Professional ballet dancer transitioning into teaching. Love classical music, foreign films, and long walks along the river. Looking for someone who appreciates art and dedication.",
    lookingFor: ["man"],
    ageRange: { min: 24, max: 35 },
    interests: ["Dancing", "Music", "Movies", "Art", "Yoga", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1520810627419-35e362c5dc07?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Camila",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "woman",
    bio: "Startup founder building the future of sustainable fashion. Love morning runs, oat milk lattes, and mentoring young entrepreneurs. Looking for someone equally driven and passionate.",
    lookingFor: ["man"],
    ageRange: { min: 27, max: 40 },
    interests: ["Fitness", "Coffee", "Fashion", "Travel", "Reading", "Nature"],
    photos: [
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560087637-bf797bc7a164?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1508243529287-e21914733111?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Scarlett",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "woman",
    bio: "Sommelier at an upscale restaurant. Love discovering new wines, cooking elaborate meals, and lazy Sunday brunches. Looking for someone who enjoys the finer things in life.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 25, max: 38 },
    interests: ["Wine", "Cooking", "Foodie", "Travel", "Art", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Victoria",
    dateOfBirth: ageToDateOfBirth(32),
    gender: "woman",
    bio: "Museum curator with a PhD in art history. Love weekend gallery hopping, reading biographies, and discussing conspiracy theories. Looking for an intellectual who can keep me engaged.",
    lookingFor: ["man"],
    ageRange: { min: 28, max: 45 },
    interests: ["Art", "Reading", "Movies", "Wine", "Travel", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1557555187-23d685287bc3?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Madison",
    dateOfBirth: ageToDateOfBirth(25),
    gender: "woman",
    bio: "Fitness influencer and certified nutritionist. Love sunrise workouts, meal prep Sundays, and helping others reach their goals. Looking for someone who shares my healthy lifestyle.",
    lookingFor: ["man"],
    ageRange: { min: 23, max: 32 },
    interests: ["Fitness", "Yoga", "Cooking", "Beach", "Photography", "Hiking"],
    photos: [
      "https://images.unsplash.com/photo-1518310952931-b1de897abd40?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Penelope",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "woman",
    bio: "Veterinarian with a soft spot for animals of all sizes. Love nature documentaries, farmers markets, and finding the best hole-in-the-wall restaurants. Seeking a kind soul.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 25, max: 36 },
    interests: ["Pets", "Nature", "Foodie", "Movies", "Hiking", "Reading"],
    photos: [
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Grace",
    dateOfBirth: ageToDateOfBirth(30),
    gender: "woman",
    bio: "Classical pianist turned music therapist. Love live concerts, road trips, and baking elaborate desserts. Looking for someone who appreciates both silence and symphony.",
    lookingFor: ["man"],
    ageRange: { min: 27, max: 40 },
    interests: ["Music", "Cooking", "Travel", "Art", "Reading", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Chloe",
    dateOfBirth: ageToDateOfBirth(24),
    gender: "woman",
    bio: "UX designer who's obsessed with making technology more human. Love escape rooms, true crime podcasts, and competitive mini golf. Looking for someone playful and creative.",
    lookingFor: ["man", "woman"],
    ageRange: { min: 22, max: 30 },
    interests: ["Gaming", "Art", "Coffee", "Movies", "Music", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Riley",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "woman",
    bio: "Sports journalist covering professional soccer. Love the beautiful game, craft beer, and heated sports debates. Looking for someone who won't mind my weekend schedule during season.",
    lookingFor: ["man"],
    ageRange: { min: 24, max: 34 },
    interests: ["Sports", "Travel", "Photography", "Foodie", "Movies", "Fitness"],
    photos: [
      "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1513379733131-47fc74b45fc7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80&fit=crop",
    ],
  },

  // ============================================================================
  // MEN PROFILES
  // ============================================================================
  {
    name: "Marcus",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "man",
    bio: "Software engineer by day, musician by night. I love playing guitar, attending jazz concerts, and exploring local coffee shops. Seeking someone creative and curious.",
    lookingFor: ["woman"],
    ageRange: { min: 23, max: 32 },
    interests: ["Music", "Coffee", "Coffee", "Reading", "Art", "Reading"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "James",
    dateOfBirth: ageToDateOfBirth(31),
    gender: "man",
    bio: "Documentary filmmaker who's passionate about storytelling. Recently got into rock climbing and I'm always up for trying new outdoor activities. Dog dad to a golden retriever named Bear.",
    lookingFor: ["woman"],
    ageRange: { min: 25, max: 35 },
    interests: ["Movies", "Hiking", "Pets", "Photography", "Nature", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Ethan",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "man",
    bio: "Architect who loves building things, both digitally and physically. Weekend surfer, amateur woodworker, and dedicated coffee snob. Seeking someone adventurous and creative.",
    lookingFor: ["woman"],
    ageRange: { min: 24, max: 32 },
    interests: ["Art", "Sports", "Coffee", "Coffee", "Art", "Beach"],
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Noah",
    dateOfBirth: ageToDateOfBirth(30),
    gender: "man",
    bio: "Chef at a farm-to-table restaurant. Obsessed with sustainable food and local ingredients. When I'm not in the kitchen, you'll find me at the farmers market or on my bike.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 25, max: 38 },
    interests: ["Cooking", "Nature", "Fitness", "Foodie", "Wine", "Nature"],
    photos: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Alexander",
    dateOfBirth: ageToDateOfBirth(33),
    gender: "man",
    bio: "Venture capitalist with a startup background. Tennis player, wine enthusiast, and amateur chef. Seeking someone ambitious who enjoys deep conversations and spontaneous travel.",
    lookingFor: ["woman"],
    ageRange: { min: 26, max: 38 },
    interests: ["Sports", "Wine", "Travel", "Travel", "Cooking", "Reading"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Liam",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "man",
    bio: "Emergency room physician who needs someone to help me unwind. Love cooking Italian food, watching Premier League, and weekend hiking trips. Looking for someone patient and fun.",
    lookingFor: ["woman"],
    ageRange: { min: 24, max: 33 },
    interests: ["Cooking", "Sports", "Hiking", "Movies", "Travel", "Wine"],
    photos: [
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Benjamin",
    dateOfBirth: ageToDateOfBirth(32),
    gender: "man",
    bio: "Corporate lawyer by day, stand-up comedy enthusiast by night. Love whiskey tastings, political debates, and finding the best brunch spots. Seeking someone witty and opinionated.",
    lookingFor: ["woman"],
    ageRange: { min: 26, max: 38 },
    interests: ["Movies", "Foodie", "Reading", "Travel", "Wine", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "William",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "man",
    bio: "Product manager at a tech startup. Love indoor climbing, board game nights, and perfecting my espresso technique. Looking for someone curious who enjoys both adventure and cozy nights in.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 25, max: 35 },
    interests: ["Hiking", "Gaming", "Coffee", "Travel", "Music", "Movies"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Sebastian",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "man",
    bio: "Photographer specializing in street photography. Love urban exploration, vintage cameras, and late-night conversations over ramen. Seeking someone artistic with their own creative passion.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 23, max: 32 },
    interests: ["Photography", "Art", "Foodie", "Travel", "Music", "Coffee"],
    photos: [
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Oliver",
    dateOfBirth: ageToDateOfBirth(30),
    gender: "man",
    bio: "High school history teacher who makes the past come alive. Love museums, historical fiction, and planning elaborate themed dinner parties. Looking for someone intellectually curious.",
    lookingFor: ["woman"],
    ageRange: { min: 26, max: 36 },
    interests: ["Reading", "Cooking", "Movies", "Travel", "Wine", "Art"],
    photos: [
      "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Daniel",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "man",
    bio: "Physical therapist and former college basketball player. Love staying active, weekend beach trips, and trying new workout classes. Looking for someone who enjoys an active lifestyle.",
    lookingFor: ["woman"],
    ageRange: { min: 22, max: 30 },
    interests: ["Sports", "Fitness", "Beach", "Movies", "Music", "Foodie"],
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Matthew",
    dateOfBirth: ageToDateOfBirth(34),
    gender: "man",
    bio: "Airline pilot who's been to more countries than I can count. Love scuba diving, photography, and collecting stories from around the world. Seeking someone who doesn't mind my travel schedule.",
    lookingFor: ["woman"],
    ageRange: { min: 27, max: 40 },
    interests: ["Travel", "Photography", "Beach", "Hiking", "Wine", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Henry",
    dateOfBirth: ageToDateOfBirth(31),
    gender: "man",
    bio: "Craft brewery owner living my dream. Love experimenting with new recipes, live music, and Sunday farmers markets. Looking for someone who enjoys good beer and better conversation.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 25, max: 38 },
    interests: ["Foodie", "Music", "Nature", "Cooking", "Coffee", "Art"],
    photos: [
      "https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Jackson",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "man",
    bio: "Financial analyst who knows how to balance work and play. Love skiing, golf, and finding the best happy hour in the city. Seeking someone ambitious with a great sense of humor.",
    lookingFor: ["woman"],
    ageRange: { min: 24, max: 32 },
    interests: ["Sports", "Travel", "Wine", "Foodie", "Movies", "Fitness"],
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Aiden",
    dateOfBirth: ageToDateOfBirth(25),
    gender: "man",
    bio: "Graphic designer with an obsession for clean aesthetics. Love cycling, indie films, and discovering new music. Looking for someone creative who appreciates the beauty in everyday things.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 22, max: 30 },
    interests: ["Art", "Fitness", "Movies", "Music", "Coffee", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Lucas",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "man",
    bio: "Marine biologist who spends half his life in the ocean. Love surfing, environmental activism, and cooking seafood the right way. Seeking someone who cares about our planet.",
    lookingFor: ["woman"],
    ageRange: { min: 25, max: 35 },
    interests: ["Beach", "Nature", "Cooking", "Travel", "Photography", "Hiking"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Mason",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "man",
    bio: "Mechanical engineer who builds race cars as a hobby. Love track days, road trips, and fixing things with my hands. Looking for someone who appreciates passion and dedication.",
    lookingFor: ["woman"],
    ageRange: { min: 24, max: 33 },
    interests: ["Sports", "Travel", "Movies", "Music", "Fitness", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Logan",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "man",
    bio: "Music producer working with indie artists. Love vinyl, live shows, and late-night studio sessions. Seeking someone creative who understands the artist lifestyle.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 22, max: 32 },
    interests: ["Music", "Art", "Coffee", "Dancing", "Fashion", "Movies"],
    photos: [
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Ryan",
    dateOfBirth: ageToDateOfBirth(32),
    gender: "man",
    bio: "Real estate developer with an eye for potential. Love architecture tours, wine country weekends, and renovating my 1920s home. Looking for someone who appreciates craftsmanship.",
    lookingFor: ["woman"],
    ageRange: { min: 27, max: 40 },
    interests: ["Art", "Wine", "Travel", "Cooking", "Photography", "Nature"],
    photos: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Nathan",
    dateOfBirth: ageToDateOfBirth(30),
    gender: "man",
    bio: "Personal trainer who believes fitness should be fun. Love HIIT, meal prep, and helping people transform their lives. Seeking someone who values health and personal growth.",
    lookingFor: ["woman"],
    ageRange: { min: 25, max: 35 },
    interests: ["Fitness", "Cooking", "Hiking", "Beach", "Sports", "Yoga"],
    photos: [
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Dylan",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "man",
    bio: "Veterinarian specializing in exotic animals. Love nature documentaries, hiking, and my two rescue cats. Looking for someone kind who shares my love for animals.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 24, max: 34 },
    interests: ["Pets", "Nature", "Hiking", "Movies", "Photography", "Reading"],
    photos: [
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Caleb",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "man",
    bio: "Cybersecurity expert who protects companies from hackers. Love escape rooms, chess, and solving complex puzzles. Seeking someone intelligent who enjoys mental challenges.",
    lookingFor: ["woman"],
    ageRange: { min: 25, max: 35 },
    interests: ["Gaming", "Coffee", "Reading", "Movies", "Travel", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Brandon",
    dateOfBirth: ageToDateOfBirth(31),
    gender: "man",
    bio: "Executive chef at a Michelin-starred restaurant. Love farmers markets, wine pairings, and cooking elaborate meals for friends. Looking for someone who appreciates culinary art.",
    lookingFor: ["woman"],
    ageRange: { min: 26, max: 38 },
    interests: ["Cooking", "Wine", "Foodie", "Travel", "Art", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Tyler",
    dateOfBirth: ageToDateOfBirth(25),
    gender: "man",
    bio: "Content creator and travel vlogger. Love exploring hidden gems, trying street food, and connecting with people worldwide. Seeking someone adventurous who doesn't mind living on camera.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 21, max: 30 },
    interests: ["Travel", "Photography", "Foodie", "Music", "Beach", "Hiking"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Zachary",
    dateOfBirth: ageToDateOfBirth(33),
    gender: "man",
    bio: "Patent attorney who gets genuinely excited about innovation. Love sci-fi, chess, and building elaborate LEGO sets. Looking for someone nerdy who doesn't take themselves too seriously.",
    lookingFor: ["woman"],
    ageRange: { min: 27, max: 40 },
    interests: ["Reading", "Gaming", "Movies", "Coffee", "Travel", "Art"],
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Justin",
    dateOfBirth: ageToDateOfBirth(28),
    gender: "man",
    bio: "Jazz pianist who plays at local venues. Love late-night jam sessions, vinyl collecting, and cooking soul food. Seeking someone who appreciates music and genuine connection.",
    lookingFor: ["woman"],
    ageRange: { min: 24, max: 34 },
    interests: ["Music", "Cooking", "Art", "Coffee", "Dancing", "Movies"],
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Aaron",
    dateOfBirth: ageToDateOfBirth(30),
    gender: "man",
    bio: "Orthopedic surgeon who spends free time on the slopes. Love skiing, mountain biking, and anything that gets adrenaline pumping. Looking for an adventurous spirit.",
    lookingFor: ["woman"],
    ageRange: { min: 26, max: 36 },
    interests: ["Sports", "Travel", "Hiking", "Fitness", "Nature", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Adrian",
    dateOfBirth: ageToDateOfBirth(27),
    gender: "man",
    bio: "Social media marketing manager for lifestyle brands. Love rooftop bars, weekend festivals, and staying ahead of trends. Seeking someone social who knows how to have fun.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 23, max: 32 },
    interests: ["Music", "Fashion", "Foodie", "Dancing", "Travel", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Christian",
    dateOfBirth: ageToDateOfBirth(29),
    gender: "man",
    bio: "Urban planner working to make cities more livable. Love cycling, community gardens, and local politics. Looking for someone who cares about building a better future.",
    lookingFor: ["woman"],
    ageRange: { min: 25, max: 35 },
    interests: ["Nature", "Fitness", "Reading", "Coffee", "Art", "Cooking"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&fit=crop",
    ],
  },
  {
    name: "Cameron",
    dateOfBirth: ageToDateOfBirth(26),
    gender: "man",
    bio: "Startup founder in the sustainable tech space. Love brainstorming sessions, meditation retreats, and building things from scratch. Seeking someone driven with big dreams.",
    lookingFor: ["woman", "man"],
    ageRange: { min: 23, max: 33 },
    interests: ["Reading", "Yoga", "Coffee", "Travel", "Hiking", "Art"],
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&fit=crop",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80&fit=crop",
    ],
  },
];

/**
 * Map profiles with locations - all in SF Bay Area
 */
export const demoProfiles: DemoProfile[] = baseProfiles.map((profile, index) => {
  return {
    ...profile,
    location: sfLocations[index % sfLocations.length],
    maxDistance: maxDistances[index % maxDistances.length],
  };
});
