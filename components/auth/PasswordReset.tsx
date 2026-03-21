import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassBackButton, GlassButton, GlassInput } from "@/components/glass";
import { HeaderIcon, KeyboardAwareView } from "@/components/ui";
import { useAppTheme } from "@/lib/theme";

interface PasswordResetProps {
  /** Email address to display in the subtitle */
  email: string;
  /** Called when user submits the code and new password - should throw on error */
  onVerify: (code: string, newPassword: string) => Promise<void>;
  /** Called when user presses back button */
  onBack: () => void;
}

export function PasswordReset({
  email,
  onVerify,
  onBack,
}: PasswordResetProps) {
  const { colors } = useAppTheme();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      await onVerify(code, newPassword);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCode("");
    setNewPassword("");
    setError("");
    onBack();
  };

  const isValid = code.length > 0 && newPassword.length >= 8;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.backButtonContainer}>
        <GlassBackButton onPress={handleBack} />
      </Animated.View>

      <KeyboardAwareView style={styles.keyboardView}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <HeaderIcon icon="key-outline" />
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              We sent a password reset code to {email}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
            <GlassInput
              placeholder="Enter reset code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoFocus
            />

            <GlassInput
              placeholder="New password (min 8 chars)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            {error ? (
              <Animated.Text entering={FadeInDown.duration(300)} style={styles.error}>
                {error}
              </Animated.Text>
            ) : null}
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
          <GlassButton
            onPress={handleVerify}
            label={loading ? "Resetting..." : "Reset Password"}
            disabled={loading || !isValid}
          />
        </Animated.View>
      </KeyboardAwareView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  error: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    padding: 24,
  },
});
