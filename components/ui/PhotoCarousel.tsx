import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoIndicators } from "./PhotoIndicators";
import { PhotoTapZones } from "./PhotoTapZones";

interface PhotoCarouselProps {
  /** Array of photo URLs to display */
  photos: string[];
  /** Height of the carousel in pixels */
  height: number;
  /** Callback when the photo index changes */
  onPhotoChange?: (index: number) => void;
  /** Whether to show photo indicators (default: true) */
  showIndicators?: boolean;
  /** Whether to show gradient overlay (default: true) */
  showGradient?: boolean;
  /** Custom gradient colors (default: transparent to black) */
  gradientColors?: readonly [string, string, ...string[]];
  /** Content to overlay on the photo (e.g., name, info) */
  children?: ReactNode;
  /** Top offset for indicators (default: uses safe area insets) */
  indicatorTopOffset?: number;
}

/**
 * A photo carousel with tap-to-navigate, indicators, and optional gradient overlay.
 * Used for profile photos in various views.
 */
export function PhotoCarousel({
  photos,
  height,
  onPhotoChange,
  showIndicators = true,
  showGradient = true,
  gradientColors = ["transparent", "transparent", "rgba(0,0,0,0.6)"],
  children,
  indicatorTopOffset,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const safePhotos = photos.length > 0 ? photos : ["https://via.placeholder.com/400x500"];
  const currentPhoto = safePhotos[currentIndex];

  const handleTap = (side: "left" | "right") => {
    const newIndex =
      side === "right"
        ? (currentIndex + 1) % safePhotos.length
        : (currentIndex - 1 + safePhotos.length) % safePhotos.length;
    setCurrentIndex(newIndex);
    onPhotoChange?.(newIndex);
  };

  const topOffset = indicatorTopOffset ?? insets.top + 12;

  return (
    <View style={[styles.container, { height }]}>
      <Image source={{ uri: currentPhoto }} style={styles.photo} />

      {showGradient && (
        <LinearGradient colors={gradientColors} style={styles.gradient} />
      )}

      {showIndicators && safePhotos.length > 1 && (
        <PhotoIndicators
          count={safePhotos.length}
          currentIndex={currentIndex}
          style={{ top: topOffset }}
        />
      )}

      {safePhotos.length > 1 && <PhotoTapZones onTap={handleTap} />}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
});
