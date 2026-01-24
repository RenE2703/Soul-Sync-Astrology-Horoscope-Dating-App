/**
 * Interest options with emoji icons.
 * Single source of truth for interests used in onboarding and profile editing.
 */
export const INTERESTS = [
  { name: "Travel", emoji: "✈️" },
  { name: "Music", emoji: "🎵" },
  { name: "Fitness", emoji: "💪" },
  { name: "Photography", emoji: "📸" },
  { name: "Cooking", emoji: "👨‍🍳" },
  { name: "Reading", emoji: "📚" },
  { name: "Movies", emoji: "🎬" },
  { name: "Art", emoji: "🎨" },
  { name: "Gaming", emoji: "🎮" },
  { name: "Hiking", emoji: "🥾" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Dancing", emoji: "💃" },
  { name: "Coffee", emoji: "☕" },
  { name: "Wine", emoji: "🍷" },
  { name: "Pets", emoji: "🐕" },
  { name: "Sports", emoji: "⚽" },
  { name: "Nature", emoji: "🌿" },
  { name: "Beach", emoji: "🏖️" },
  { name: "Fashion", emoji: "👗" },
  { name: "Foodie", emoji: "🍜" },
] as const;

/** Interest names only (derived from INTERESTS) */
export const INTEREST_NAMES = INTERESTS.map((i) => i.name);

/** Type for interest name */
export type InterestName = (typeof INTEREST_NAMES)[number];

/** Minimum number of interests required */
export const MIN_INTERESTS = 3;

/** Maximum number of interests allowed */
export const MAX_INTERESTS = 6;
