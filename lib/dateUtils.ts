/**
 * Date utility functions for date of birth handling.
 * Used for age calculation and date validation in the app.
 */

/** Minimum age allowed (18 years) */
export const MIN_AGE = 18;

/** Maximum age allowed (99 years) */
export const MAX_AGE = 99;

/** Default age for initial picker value (25 years) */
export const DEFAULT_AGE = 25;

/**
 * Calculate age from a Date object.
 * @param date - Date of birth
 * @returns Age in years
 */
export function calculateAgeFromDate(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get the minimum valid date of birth (MAX_AGE years ago).
 * @returns Date representing the oldest allowed birth date
 */
export function getMinDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MAX_AGE);
  return date;
}

/**
 * Get the maximum valid date of birth (MIN_AGE years ago).
 * @returns Date representing the youngest allowed birth date
 */
export function getMaxDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MIN_AGE);
  return date;
}

/**
 * Get a default date of birth (DEFAULT_AGE years ago).
 * @returns Date representing a sensible default for the picker
 */
export function getDefaultDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - DEFAULT_AGE);
  return date;
}

/**
 * Check if a date is a valid date of birth (between MIN_AGE and MAX_AGE).
 * @param date - Date to validate
 * @returns True if the date is valid
 */
export function isValidDateOfBirth(date: Date): boolean {
  const age = calculateAgeFromDate(date);
  return age >= MIN_AGE && age <= MAX_AGE;
}
