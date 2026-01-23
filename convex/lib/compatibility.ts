import { Doc } from "../_generated/dataModel";
import { isWithinDistance } from "./distance";

/**
 * Check if two users are compatible based on their preferences.
 * This performs bidirectional checks for:
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
