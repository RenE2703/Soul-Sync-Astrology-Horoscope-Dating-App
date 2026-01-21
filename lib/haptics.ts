import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Haptic feedback utility functions for consistent tactile feedback

/**
 * Light haptic for button presses and selections
 */
export const hapticLight = () => {
  if (Platform.OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Medium haptic for significant actions like swipe threshold
 */
export const hapticMedium = () => {
  if (Platform.OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Heavy haptic for important confirmations
 */
export const hapticHeavy = () => {
  if (Platform.OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Selection haptic for UI element selection
 */
export const hapticSelection = () => {
  if (Platform.OS === "ios") {
    Haptics.selectionAsync();
  }
};

/**
 * Success notification for positive outcomes like matches
 */
export const hapticSuccess = () => {
  if (Platform.OS === "ios") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Warning notification
 */
export const hapticWarning = () => {
  if (Platform.OS === "ios") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Error notification for negative outcomes
 */
export const hapticError = () => {
  if (Platform.OS === "ios") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

// Semantic haptic functions for the dating app

/**
 * Haptic for swiping on a profile card
 */
export const hapticSwipe = () => hapticMedium();

/**
 * Haptic for liking a profile
 */
export const hapticLike = () => hapticMedium();

/**
 * Haptic for rejecting a profile
 */
export const hapticReject = () => hapticLight();

/**
 * Haptic for when a match is made
 */
export const hapticMatch = () => hapticSuccess();

/**
 * Haptic for sending a message
 */
export const hapticMessageSent = () => hapticLight();

/**
 * Haptic for receiving a message
 */
export const hapticMessageReceived = () => hapticLight();

/**
 * Haptic for button press
 */
export const hapticButtonPress = () => hapticSelection();

/**
 * Haptic for tab selection
 */
export const hapticTabPress = () => hapticSelection();
