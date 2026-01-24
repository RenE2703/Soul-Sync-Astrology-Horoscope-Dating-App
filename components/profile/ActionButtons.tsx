import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { hapticButtonPress } from "@/lib/haptics";
import { shadowMedium } from "@/lib/styles";
import { useAppTheme } from "@/lib/theme";

interface ActionButtonsProps {
  onReject: () => void;
  onLike: () => void;
  onSuperLike?: () => void;
  disabled?: boolean;
}

export function ActionButtons({
  onReject,
  onLike,
  onSuperLike,
  disabled = false,
}: ActionButtonsProps) {
  const { colors } = useAppTheme();

  const handleReject = () => {
    hapticButtonPress();
    onReject();
  };

  const handleLike = () => {
    hapticButtonPress();
    onLike();
  };

  const handleSuperLike = () => {
    hapticButtonPress();
    onSuperLike?.();
  };

  return (
    <View style={styles.container}>
      {/* Reject button */}
      <TouchableOpacity
        style={[styles.button, styles.rejectButton]}
        onPress={handleReject}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={32} color={colors.reject} />
      </TouchableOpacity>

      {/* Super like button (optional) */}
      {onSuperLike && (
        <TouchableOpacity
          style={[styles.button, styles.superLikeButton]}
          onPress={handleSuperLike}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={24} color="#FFD700" />
        </TouchableOpacity>
      )}

      {/* Like button */}
      <TouchableOpacity
        style={[styles.button, styles.likeButton]}
        onPress={handleLike}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={32} color={colors.like} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 20,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    ...shadowMedium,
  },
  rejectButton: {
    borderWidth: 2,
    borderColor: "#FF3B30",
  },
  likeButton: {
    borderWidth: 2,
    borderColor: "#4CD964",
  },
  superLikeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
});
