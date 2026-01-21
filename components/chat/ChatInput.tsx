import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { GlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticMessageSent } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const { colors, isDark } = useAppTheme();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    hapticMessageSent();
    onSend(message.trim());
    setMessage("");
  };

  const canSend = message.trim().length > 0 && !disabled;

  // Glass version for iOS 26+
  if (supportsGlassEffect) {
    return (
      <View style={styles.container}>
        <GlassView style={styles.glassContainer} glassEffectStyle="regular">
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={message}
              onChangeText={setMessage}
              maxLength={1000}
              editable={!disabled}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButtonWrapper,
                pressed && styles.sendButtonPressed,
              ]}
            >
              <GlassView
                style={styles.sendButton}
                glassEffectStyle="regular"
                tintColor={canSend ? colors.primary : undefined}
                isInteractive
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={canSend ? "#FFFFFF" : colors.onSurfaceVariant}
                />
              </GlassView>
            </Pressable>
          </View>
        </GlassView>
      </View>
    );
  }

  // Sleek fallback for older iOS / Android using BlurView
  return (
    <View style={styles.container}>
      <View style={styles.blurWrapper}>
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={styles.blurContainer}
        >
          <View style={styles.inputRow}>
            <View
              style={[
                styles.fallbackInputContainer,
                { 
                  backgroundColor: isDark 
                    ? "rgba(255,255,255,0.1)" 
                    : "rgba(0,0,0,0.05)",
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.onSurfaceVariant}
                value={message}
                onChangeText={setMessage}
                maxLength={1000}
                editable={!disabled}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.fallbackSendButton,
                {
                  backgroundColor: canSend
                    ? colors.primary
                    : isDark 
                      ? "rgba(255,255,255,0.15)" 
                      : "rgba(0,0,0,0.08)",
                },
                pressed && styles.sendButtonPressed,
              ]}
            >
              <Ionicons
                name="send"
                size={20}
                color={canSend ? colors.onPrimary : colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  // Glass styles
  glassContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonWrapper: {
    borderRadius: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  // Fallback styles with blur
  blurWrapper: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 28,
    overflow: "hidden",
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blurContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 28,
    overflow: "hidden",
  },
  fallbackInputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  fallbackSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
