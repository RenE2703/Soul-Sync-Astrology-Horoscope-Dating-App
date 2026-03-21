import { useUser } from "@clerk/clerk-expo";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassButton, GlassCard } from "@/components/glass";
import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/lib/theme";

export default function TarotTab() {
  const { user } = useUser();
  const { colors } = useAppTheme();

  const existingReading = useQuery(
    api.tarot.getTodayReading,
    user?.id ? { clerkId: user.id } : "skip" // Wait for user to be ready
  );

  const drawCard = useAction(api.tarot.drawDailyCard);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnData, setDrawnData] = useState<{ cardName: string; reading: string } | null>(null);

  const handleDraw = async () => {
    if (!user?.id) return;
    setIsDrawing(true);
    try {
      const result = await drawCard({ clerkId: user.id });
      setDrawnData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrawing(false);
    }
  };

  const currentReading = existingReading || drawnData;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.onBackground }]}>Mystic Guidance</Text>
                <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Your daily SoulSync tarot reading</Text>
            </View>

            {existingReading === undefined ? (
                <View style={[styles.content, {justifyContent: "center"}]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : !currentReading ? (
                <View style={styles.content}>
                    <GlassCard style={styles.cardBack}>
                        <Text style={[styles.cardDesign, { color: colors.accent }]}>✨ ☯️ ✨</Text>
                        <Text style={[styles.cardInstruction, { color: colors.onSurface }]}>Tap into the universe's energy.</Text>
                        <Text style={[styles.cardInstruction, { color: colors.onSurface }]}>Focus on your romantic desires.</Text>
                    </GlassCard>
                    <Animated.View entering={FadeInUp.delay(300)} style={styles.buttonContainer}>
                        <GlassButton 
                            label={isDrawing ? "Shuffling cards..." : "Draw My Daily Card"} 
                            onPress={handleDraw} 
                            disabled={isDrawing} 
                        />
                    </Animated.View>
                </View>
            ) : (
                <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
                    <GlassCard style={[styles.cardFront, { borderColor: colors.primary }]}>
                        <Animated.Text entering={FadeIn.delay(200)} style={[styles.cardName, { color: colors.onSurface }]}>
                            {currentReading.cardName}
                        </Animated.Text>
                        <Animated.Text entering={FadeIn.delay(500)} style={[styles.readingText, { color: colors.onSurfaceVariant }]}>
                            {currentReading.reading}
                        </Animated.Text>
                    </GlassCard>
                    <View style={styles.buttonContainer}>
                        <Text style={[styles.comeBackText, { color: colors.onSurfaceVariant }]}>
                            Come back tomorrow for a new reading!
                        </Text>
                    </View>
                </Animated.View>
            )}
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 34, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.8 },
  content: { flex: 1, alignItems: "center" },
  cardBack: {
    width: "100%",
    aspectRatio: 2 / 3,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
    backgroundColor: "#2D3142", // Hardcoded dark mystic element
  },
  cardDesign: { fontSize: 60, marginBottom: 32 },
  cardInstruction: { fontSize: 16, textAlign: "center", marginBottom: 8 },
  buttonContainer: { width: "100%", marginTop: "auto", marginBottom: 60 },
  cardFront: {
    width: "100%",
    minHeight: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 40,
  },
  cardName: { fontSize: 28, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  readingText: { fontSize: 18, lineHeight: 28, textAlign: "center" },
  comeBackText: { textAlign: "center", fontSize: 16, fontStyle: "italic" }
});
