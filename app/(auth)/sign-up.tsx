import { useSignUp } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CodeVerification } from "@/components/auth";
import { GlassBackButton, GlassButton, GlassInput } from "@/components/glass";
import { HeaderIcon, KeyboardAwareView } from "@/components/ui";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;

    hapticButtonPress();
    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (!isLoaded) return;

    const result = await signUp.attemptEmailAddressVerification({ code });

    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId });
      // Navigation is handled by protected routes
    } else {
      throw new Error(`Verification incomplete: ${result.status}`);
    }
  };

  if (pendingVerification) {
    return (
      <CodeVerification
        email={email}
        title="Verify your email"
        icon="mail-outline"
        onVerify={handleVerify}
        onBack={() => setPendingVerification(false)}
        buttonText="Verify Email"
        backButtonText="Back to sign up"
      />
    );
  }

  const isValid = email.trim().length > 0 && password.length >= 6;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.backButtonContainer}>
        <GlassBackButton />
      </Animated.View>

      <KeyboardAwareView style={styles.keyboardView}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <HeaderIcon icon="rocket-outline" />
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Start your journey to find meaningful connections
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
              autoComplete="new-password"
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
            onPress={handleSignUp}
            label={loading ? "Creating account..." : "Create Account"}
            disabled={loading || !isValid}
          />

          <View style={styles.footerLink}>
            <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity onPress={hapticButtonPress}>
                <Text style={[styles.link, { color: colors.primary }]}>
                  Sign In
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
