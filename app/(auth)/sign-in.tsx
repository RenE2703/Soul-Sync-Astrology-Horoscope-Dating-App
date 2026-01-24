import { useSignIn } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CodeVerification } from "@/components/auth";
import { hapticButtonPress } from "@/lib/haptics";
import { shadowPrimary } from "@/lib/styles/shadows";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Floating heart decoration component
function FloatingHeart({
  size,
  top,
  left,
  delay,
  opacity,
}: {
  size: number;
  top: number;
  left: number;
  delay: number;
  opacity: number;
}) {
  const translateY = useSharedValue(0);

  // Start floating animation
  translateY.value = withRepeat(
    withSequence(
      withTiming(-10, { duration: 2000 }),
      withTiming(10, { duration: 2000 })
    ),
    -1,
    true
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(1000)}
      style={[
        {
          position: "absolute",
          top,
          left,
          opacity,
        },
        animatedStyle,
      ]}
    >
      <SymbolView name="heart.fill" size={size} tintColor="#FF6B6B" />
    </Animated.View>
  );
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
      } else if (result.status === "needs_second_factor") {
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
    } else {
      throw new Error(`Verification incomplete: ${result.status}`);
    }
  };

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
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFF5F5", "#FFE8E8", "#FFF0F0", "#FFFFFF"]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative floating hearts */}
      <FloatingHeart size={24} top={80} left={40} delay={0} opacity={0.15} />
      <FloatingHeart size={18} top={140} left={320} delay={200} opacity={0.12} />
      <FloatingHeart size={32} top={560} left={20} delay={400} opacity={0.1} />
      <FloatingHeart size={20} top={600} left={340} delay={600} opacity={0.08} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(700).springify()}
            style={styles.logoSection}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#FF6B6B", "#FF8E8E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <SymbolView name="heart.fill" size={42} tintColor="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.logoText}>Heartly</Text>
            <Text style={styles.logoTagline}>Find your perfect match</Text>
          </Animated.View>

          {/* Input Section */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(700).springify()}
            style={styles.inputSection}
          >
            {/* Email Input */}
            <View
              style={[
                styles.inputContainer,
                emailFocused && styles.inputContainerFocused,
              ]}
            >
              <View style={styles.inputIconContainer}>
                <SymbolView
                  name="envelope.fill"
                  size={20}
                  tintColor={emailFocused ? "#FF6B6B" : "#999999"}
                />
              </View>
              <TextInput
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={styles.input}
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {/* Password Input */}
            <View
              style={[
                styles.inputContainer,
                passwordFocused && styles.inputContainerFocused,
              ]}
            >
              <View style={styles.inputIconContainer}>
                <SymbolView
                  name="lock.fill"
                  size={20}
                  tintColor={passwordFocused ? "#FF6B6B" : "#999999"}
                />
              </View>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoComplete="password"
                style={styles.input}
                placeholderTextColor="#AAAAAA"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <SymbolView
                  name={showPassword ? "eye.slash.fill" : "eye.fill"}
                  size={20}
                  tintColor="#999999"
                />
              </Pressable>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.errorContainer}
              >
                <SymbolView
                  name="exclamationmark.triangle.fill"
                  size={16}
                  tintColor="#DC2626"
                />
                <Text selectable style={styles.errorText}>
                  {error}
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>

          <View style={{ flex: 1, minHeight: 40 }} />

          {/* Bottom Section */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(700).springify()}
            style={styles.bottomSection}
          >
            {/* Sign In Button */}
            <AnimatedPressable
              onPress={handleSignIn}
              disabled={loading || !isValid}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  opacity: loading || !isValid ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={["#FF6B6B", "#FF5252"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Signing in...</Text>
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <SymbolView
                      name="arrow.right"
                      size={18}
                      tintColor="#FFFFFF"
                    />
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity onPress={hapticButtonPress}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  logoSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
  },
  logoContainer: {
    ...shadowPrimary,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  logoTagline: {
    fontSize: 15,
    color: "#888888",
    fontWeight: "500",
  },
  inputSection: {
    gap: 16,
  },
  inputContainer: {
    height: 56,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputContainerFocused: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFFFFF",
  },
  inputIconContainer: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    paddingRight: 16,
  },
  eyeButton: {
    width: 48,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(220,38,38,0.08)",
    padding: 14,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSection: {
    gap: 24,
  },
  primaryButton: {
    borderRadius: 28,
    borderCurve: "continuous",
    overflow: "hidden",
    ...shadowPrimary,
  },
  buttonGradient: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 8,
  },
  signUpText: {
    fontSize: 15,
    color: "#666666",
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B6B",
  },
});
