import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/lib/theme";

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: number;
}

export function MessageBubble({ content, isOwn, timestamp }: MessageBubbleProps) {
  const { colors } = useAppTheme();

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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
            ? [styles.ownBubble, { backgroundColor: colors.primary }]
            : [styles.otherBubble, { backgroundColor: colors.surfaceVariant }],
        ]}
      >
        <Text
          style={[
            styles.content,
            { color: isOwn ? colors.onPrimary : colors.onSurface },
          ]}
        >
          {content}
        </Text>
      </View>
      <Text
        style={[
          styles.time,
          { color: colors.onSurfaceVariant },
          isOwn ? styles.ownTime : styles.otherTime,
        ]}
      >
        {time}
      </Text>
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
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTime: {
    marginRight: 4,
  },
  otherTime: {
    marginLeft: 4,
  },
});
