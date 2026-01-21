import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: number;
  status?: "sending" | "failed";
  onRetry?: () => void;
}

export function MessageBubble({
  content,
  isOwn,
  timestamp,
  status,
  onRetry,
}: MessageBubbleProps) {
  const { colors } = useAppTheme();

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isSending = status === "sending";
  const isFailed = status === "failed";

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwn
            ? [
                styles.ownBubble,
                {
                  backgroundColor: isFailed
                    ? colors.error
                    : isSending
                      ? colors.primary + "CC" // Slightly transparent when sending
                      : colors.primary,
                },
              ]
            : [styles.otherBubble, { backgroundColor: colors.surfaceVariant }],
        ]}
      >
        <Text
          style={[
            styles.content,
            { color: isOwn ? colors.onPrimary : colors.onSurface },
            isSending && styles.sendingText,
          ]}
        >
          {content}
        </Text>
      </View>
      <View style={[styles.statusRow, isOwn ? styles.ownTime : styles.otherTime]}>
        {isSending && (
          <Ionicons
            name="time-outline"
            size={12}
            color={colors.onSurfaceVariant}
            style={styles.statusIcon}
          />
        )}
        {isFailed && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Ionicons name="refresh" size={12} color={colors.error} />
            <Text style={[styles.retryText, { color: colors.error }]}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        )}
        {!isFailed && (
          <Text style={[styles.time, { color: colors.onSurfaceVariant }]}>
            {isSending ? "Sending..." : time}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  ownContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  sendingText: {
    opacity: 0.9,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  time: {
    fontSize: 11,
  },
  ownTime: {
    marginRight: 4,
  },
  otherTime: {
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retryText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
