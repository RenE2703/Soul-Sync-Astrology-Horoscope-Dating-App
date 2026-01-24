import { useCallback } from "react";

import { hapticButtonPress, hapticSelection } from "@/lib/haptics";

type HapticFunction = () => void;

/**
 * Wraps a callback with haptic feedback.
 * Useful for button press handlers that need consistent haptic feedback.
 *
 * @param callback - The function to wrap with haptic feedback
 * @param hapticFn - The haptic function to use (default: hapticButtonPress)
 * @returns A memoized callback that triggers haptic feedback before calling the original
 *
 * @example
 * ```tsx
 * // Before
 * const handlePress = () => {
 *   hapticButtonPress();
 *   onPress();
 * };
 *
 * // After
 * const handlePress = useHapticPress(onPress);
 * ```
 */
export function useHapticPress<T extends (...args: any[]) => any>(
  callback: T | undefined,
  hapticFn: HapticFunction = hapticButtonPress,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return useCallback(
    (...args: Parameters<T>): ReturnType<T> | undefined => {
      hapticFn();
      return callback?.(...args);
    },
    [callback, hapticFn],
  );
}

/**
 * Wraps a callback with selection haptic feedback.
 * Ideal for toggle buttons and selection actions.
 *
 * @param callback - The function to wrap with haptic feedback
 * @returns A memoized callback that triggers selection haptic before calling the original
 */
export function useHapticSelection<T extends (...args: any[]) => any>(
  callback: T | undefined,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return useHapticPress(callback, hapticSelection);
}
