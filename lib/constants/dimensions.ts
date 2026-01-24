import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

/** Screen width in pixels */
export const SCREEN_WIDTH = width;

/** Screen height in pixels */
export const SCREEN_HEIGHT = height;

/** Standard card width (screen width minus padding) */
export const CARD_WIDTH = SCREEN_WIDTH - 32;

/** Standard spacing between cards */
export const CARD_SPACING = 12;

/** Swipe threshold for triggering actions (30% of screen width) */
export const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

/** Maximum card rotation angle during swipe (degrees) */
export const ROTATION_ANGLE = 15;

/** Photo aspect ratio for profile cards (3:4) */
export const PHOTO_ASPECT_RATIO = 3 / 4;

/** Calculate photo height based on width and aspect ratio */
export const getPhotoHeight = (photoWidth: number = CARD_WIDTH): number =>
  photoWidth / PHOTO_ASPECT_RATIO;
