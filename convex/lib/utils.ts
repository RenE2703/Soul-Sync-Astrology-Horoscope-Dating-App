import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get all matches for a user (queries both user1 and user2 indexes).
 * This handles the bidirectional nature of the matches table.
 */
export async function getAllMatchesForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"matches">[]> {
  const matchesAsUser1 = await ctx.db
    .query("matches")
    .withIndex("by_user1", (q) => q.eq("user1Id", userId))
    .collect();
  const matchesAsUser2 = await ctx.db
    .query("matches")
    .withIndex("by_user2", (q) => q.eq("user2Id", userId))
    .collect();
  return [...matchesAsUser1, ...matchesAsUser2];
}

/**
 * Get the other user's ID from a match document.
 */
export function getOtherUserId(
  match: Doc<"matches">,
  currentUserId: Id<"users">,
): Id<"users"> {
  return match.user1Id === currentUserId ? match.user2Id : match.user1Id;
}

/**
 * Calculate age from a date of birth timestamp
 * @param dateOfBirth - Unix timestamp in milliseconds
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: number): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get the minimum valid date of birth (99 years ago)
 */
export function getMinDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 99);
  return date;
}

/**
 * Get the maximum valid date of birth (18 years ago - minimum age)
 */
export function getMaxDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
}

/**
 * Get a default date of birth (25 years ago)
 */
export function getDefaultDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 25);
  return date;
}

/**
 * Build a profile text for embedding generation.
 * Combines bio and interests into a single string for AI processing.
 * @param bio - User's bio text
 * @param interests - Array of user interests
 * @returns Formatted profile text
 */
export function buildProfileText(bio: string, interests: string[]): string {
  return `${bio} Interests: ${interests.join(", ")}`;
}
