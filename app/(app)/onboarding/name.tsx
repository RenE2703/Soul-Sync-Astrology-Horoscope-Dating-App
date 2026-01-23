import { useRouter } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GlassButton, GlassInput } from "@/components/glass";
import { HeaderIcon, KeyboardAwareView } from "@/components/ui";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

export default function NameScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const isValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const handleContinue = () => {
    hapticButtonPress();
    router.push({
      pathname: "/(app)/onboarding/birthday",
      params: { firstName: firstName.trim(), lastName: lastName.trim() },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareView style={styles.keyboardView}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.questionContainer}>
            <HeaderIcon icon="hand-left-outline" />
            <Text style={[styles.title, { color: colors.onBackground }]}>
              {"What's your name?"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {"This is how you'll appear to others"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.inputContainer}>
            <GlassInput
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="next"
            />
            <GlassInput
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={isValid ? handleContinue : undefined}
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
          <GlassButton onPress={handleContinue} label="Continue" disabled={!isValid} />
        </Animated.View>
      </KeyboardAwareView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  questionContainer: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  inputContainer: { gap: 16 },
  footer: { padding: 24 },
});
