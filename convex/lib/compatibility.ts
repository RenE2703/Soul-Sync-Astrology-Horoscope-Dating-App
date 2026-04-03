import { Doc } from "../_generated/dataModel";
import { isWithinDistance } from "./distance";

// ===========================================
// ZODIAC ELEMENT COMPATIBILITY
// ===========================================

const ZODIAC_ELEMENTS: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

// Element compatibility: Fire+Air = great, Earth+Water = great, same = good
const ELEMENT_COMPAT: Record<string, Record<string, number>> = {
  Fire:  { Fire: 0.7, Air: 0.9, Earth: 0.4, Water: 0.3 },
  Air:   { Fire: 0.9, Air: 0.7, Earth: 0.5, Water: 0.4 },
  Earth: { Fire: 0.4, Air: 0.5, Earth: 0.7, Water: 0.9 },
  Water: { Fire: 0.3, Air: 0.4, Earth: 0.9, Water: 0.7 },
};

/**
 * Calculate zodiac element compatibility score (0-1)
 * Used as a "soft filter" scoring boost, not a hard filter.
 */
export function getZodiacCompatibility(
  user1Sun?: string,
  user2Sun?: string,
): number {
  if (!user1Sun || !user2Sun) return 0.5; // neutral if unknown

  const el1 = ZODIAC_ELEMENTS[user1Sun];
  const el2 = ZODIAC_ELEMENTS[user2Sun];

  if (!el1 || !el2) return 0.5;
  return ELEMENT_COMPAT[el1]?.[el2] ?? 0.5;
}

// ===========================================
// DEAL-BREAKER HARD FILTER
// ===========================================

/**
 * Check if a specific deal-breaker field conflicts between two users.
 * A conflict occurs when EITHER user has set a non-empty, non-"Any" value
 * and the other user's value is different and also non-empty/non-"Any".
 *
 * Logic:
 * - If user1 requires "Buddhist" and user2 is "Christian" → conflict
 * - If user1 requires "Any" → no conflict regardless of user2's value
 * - If user1 didn't set a value → no conflict
 */
function dealBreakerConflicts(
  pref1: string | undefined,
  pref2: string | undefined,
): boolean {
  // If either is unset or "Any", no conflict
  if (!pref1 || pref1 === "Any" || !pref2 || pref2 === "Any") return false;
  // Both have specific values → conflict if different
  return pref1 !== pref2;
}

/**
 * Check if two users pass the deal-breaker hard filter.
 * Returns false if ANY deal-breaker conflicts (bidirectional).
 */
function passDealBreakers(
  user1: Doc<"users">,
  user2: Doc<"users">,
): boolean {
  const db1 = user1.dealBreakers;
  const db2 = user2.dealBreakers;

  // If neither user has set deal-breakers, pass
  if (!db1 && !db2) return true;

  // Check each deal-breaker field bidirectionally
  // user1's preference vs user2's value AND user2's preference vs user1's value
  if (dealBreakerConflicts(db1?.religion, db2?.religion)) return false;
  if (dealBreakerConflicts(db1?.familyBackground, db2?.familyBackground)) return false;
  if (dealBreakerConflicts(db1?.politicalView, db2?.politicalView)) return false;

  return true;
}

// ===========================================
// MAIN COMPATIBILITY CHECK
// ===========================================

/**
 * Check if two users are compatible based on their preferences.
 * This performs bidirectional checks for:
 * - Deal-breakers (religion, family, politics) — HARD FILTER (instant reject)
 * - Gender preferences (both users must be interested in each other's gender)
 * - Age preferences (both users must be within each other's age range)
 * - Distance preferences (both users must be within each other's max distance)
 *
 * @param user1 First user
 * @param user2 Second user
 * @returns true if users are mutually compatible, false otherwise
 */
export function areUsersCompatible(
  user1: Doc<"users">,
  user2: Doc<"users">,
): boolean {
  // Deal-breaker hard filter (per report Section 6.2)
  if (!passDealBreakers(user1, user2)) return false;

  // Gender preferences (bidirectional)
  if (!user1.lookingFor.includes(user2.gender)) return false;
  if (!user2.lookingFor.includes(user1.gender)) return false;

  // Age preferences (bidirectional)
  if (user2.age < user1.ageRange.min || user2.age > user1.ageRange.max)
    return false;
  if (user1.age < user2.ageRange.min || user1.age > user2.ageRange.max)
    return false;

  // Distance preferences (bidirectional)
  if (!isWithinDistance(user1.location, user2.location, user1.maxDistance))
    return false;
  if (!isWithinDistance(user2.location, user1.location, user2.maxDistance))
    return false;

  return true;
}
