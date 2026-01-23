import { useSignIn } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CodeVerification } from "@/components/auth";
import { GlassButton, GlassInput } from "@/components/glass";
import { HeaderIcon, KeyboardAwareView } from "@/components/ui";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;

    hapticButtonPress();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Navigation is handled automatically by Stack.Protected guards
      } else if (result.status === "needs_second_factor") {
        // User has 2FA enabled - prepare email code verification
        await signIn.prepareSecondFactor({
          strategy: "email_code",
        });
        setNeedsSecondFactor(true);
      } else {
        setError(`Sign in incomplete: ${result.status}`);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecondFactor = async (code: string) => {
    if (!isLoaded) return;

    const result = await signIn.attemptSecondFactor({
      strategy: "email_code",
      code,
    });

    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId });
      // Navigation is handled automatically by Stack.Protected guards
    } else {
      throw new Error(`Verification incomplete: ${result.status}`);
    }
  };

  // 2FA verification screen
  if (needsSecondFactor) {
    return (
      <CodeVerification
        email={email}
        title="Verify your identity"
        icon="shield-checkmark-outline"
        onVerify={handleVerifySecondFactor}
        onBack={() => setNeedsSecondFactor(false)}
        backButtonText="Back to sign in"
      />
    );
  }

  const isValid = email.trim().length > 0 && password.length >= 6;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAwareView style={styles.keyboardView}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <HeaderIcon icon="hand-left-outline" />
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Sign in to continue finding your match
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
            <GlassInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <GlassInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
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
            onPress={handleSignIn}
            label={loading ? "Signing in..." : "Sign In"}
            disabled={loading || !isValid}
          />

          <View style={styles.footerLink}>
            <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
              Don&apos;t have an account?{" "}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity onPress={hapticButtonPress}>
                <Text style={[styles.link, { color: colors.primary }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </KeyboardAwareView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
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
    gap: 16,
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 15,
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
  },
});
