import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, StyleSheet, Text, View, ScrollView, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassButton, GlassCard } from "@/components/glass";
import { AdaptiveGlassView } from "@/lib/glass";
import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/lib/theme";
import Markdown from 'react-native-markdown-display';

export default function TarotTab() {
  const { user } = useUser();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  
  // Responsive sizing
  const isLargeScreen = width >= 768;
  const cardWidth = isLargeScreen ? 320 : width * 0.55;
  const cardHeight = cardWidth * 1.75; // Tarot card ratio ~1:1.75

  const existingReading = useQuery(
    api.tarot.getTodayReading,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const drawCard = useAction(api.tarot.drawDailyCard);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnData, setDrawnData] = useState<{
    cardName: string;
    cardImage: string;
    cardMeaning: string;
    reading: string;
  } | null>(null);

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

  const renderHeader = () => (
    <View style={[styles.header, isLargeScreen && { alignItems: "flex-start", marginBottom: 24, width: cardWidth }]}>
      <Text style={[styles.title, { color: colors.onBackground, textAlign: isLargeScreen ? "left" : "center" }]}>Mystic Guidance</Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant, textAlign: isLargeScreen ? "left" : "center" }]}>
        Your daily SoulSync tarot reading
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* On mobile, show header at the top */}
        {!isLargeScreen && renderHeader()}

        {existingReading === undefined ? (
          <View style={[styles.content, { justifyContent: "center" }]}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.loadingContainer}>
              <Text style={styles.loadingEmoji}>✨</Text>
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Consulting the cosmos...
              </Text>
            </Animated.View>
          </View>
        ) : !currentReading ? (
          // === CARD BACK (not yet drawn) ===
          <View style={[styles.content, isLargeScreen && styles.contentLarge]}>
            {/* Left Column (Card & Button) */}
            <View style={[styles.leftColumn, isLargeScreen && styles.leftColumnLarge]}>
              {isLargeScreen && renderHeader()}
              <GlassCard style={[styles.cardBack, { width: cardWidth + 20, height: cardHeight + 20 }]}>
                <LinearGradient
                  colors={["#1a1a2e", "#16213e", "#0f3460"]}
                  style={styles.cardBackGradient}
                >
                  <Animated.View entering={FadeIn.delay(200).duration(800)}>
                    <Text style={styles.cardBackStar}>✦</Text>
                  </Animated.View>
                  <Animated.View entering={FadeIn.delay(400).duration(800)}>
                    <Text style={styles.cardBackDesign}>☽ ✧ ☯ ✧ ☾</Text>
                  </Animated.View>
                  <Animated.View entering={FadeIn.delay(600).duration(800)}>
                    <Text style={styles.cardBackStar}>✦</Text>
                  </Animated.View>
                  <View style={styles.cardBackBorder} />
                </LinearGradient>
              </GlassCard>

              <Animated.View entering={FadeInUp.delay(500)} style={[styles.buttonContainer, { width: cardWidth + 20 }]}>
                <GlassButton
                  label={isDrawing ? "✨ Shuffling..." : "Draw My Daily Card"}
                  onPress={handleDraw}
                  disabled={isDrawing}
                />
              </Animated.View>
            </View>

            {/* Right Column (Instructions) */}
            <View style={[styles.rightColumn, isLargeScreen && styles.rightColumnLarge]}>
              <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.instructionContainer, isLargeScreen && { alignItems: "flex-start", marginTop: 40 }]}>
                <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
                  Focus on your romantic energy...
                </Text>
                <Text style={[styles.instructionSubtext, { color: colors.onSurfaceVariant, textAlign: isLargeScreen ? "left" : "center" }]}>
                  The cards will reveal your love guidance for today
                </Text>
              </Animated.View>
            </View>
          </View>
        ) : (
          // === CARD FRONT (drawn — show results) ===
          <Animated.View entering={FadeInDown.duration(800)} style={[styles.content, isLargeScreen && styles.contentLarge]}>
            
            {/* Left Column (Card & Name) */}
            <View style={[styles.leftColumn, isLargeScreen && styles.leftColumnLarge]}>
              {isLargeScreen && renderHeader()}

              {/* Card Meaning Badge (Moved here) */}
              {currentReading.cardMeaning ? (
                <Animated.View entering={FadeIn.delay(600).duration(500)} style={[isLargeScreen && { alignItems: "flex-start" }, { marginBottom: 20, width: cardWidth }]}>
                  <AdaptiveGlassView style={[styles.meaningBadge, { borderColor: colors.primary + "30" }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                    <Text style={[styles.meaningLabel, { color: colors.primary }]}>Love Meaning</Text>
                  </AdaptiveGlassView>
                  <Text style={[styles.meaningText, { color: colors.onSurfaceVariant, textAlign: isLargeScreen ? "left" : "center" }]}>
                    {currentReading.cardMeaning}
                  </Text>
                </Animated.View>
              ) : null}

              {currentReading.cardImage ? (
                <Animated.View entering={FadeIn.delay(200).duration(600)} style={[styles.cardImageContainer, { width: cardWidth, height: cardHeight }]}>
                  <Image
                    source={{ uri: currentReading.cardImage }}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.08)"]}
                    style={styles.cardImageShadow}
                  />
                </Animated.View>
              ) : null}

              {/* Card Name */}
              <Animated.Text
                entering={FadeIn.delay(400).duration(500)}
                style={[styles.cardName, { color: colors.onBackground }]}
              >
                {currentReading.cardName}
              </Animated.Text>
            </View>

            {/* Right Column (Meaning & Reading) */}
            <View style={[styles.rightColumn, isLargeScreen && styles.rightColumnLarge]}>

              {/* Personalized Reading */}
              <Animated.View entering={FadeIn.delay(800).duration(600)}>
                <View style={styles.readingHeader}>
                  <Ionicons name="moon" size={18} color={colors.primary} />
                  <Text style={[styles.readingHeaderText, { color: colors.onBackground }]}>
                    Your Personal Reading
                  </Text>
                </View>
                <GlassCard style={[styles.readingCard, { borderColor: colors.primary + "20" }]}>
                  <Markdown
                    style={{
                      body: { ...styles.readingText, color: colors.onSurface },
                      strong: { fontWeight: "800", color: colors.primary, marginTop: 8, marginBottom: 4 },
                      em: { fontStyle: "italic", opacity: 0.9 },
                      bullet_list: { marginTop: 4, marginBottom: 12 },
                      list_item: { marginBottom: 4 }
                    }}
                  >
                    {currentReading.reading}
                  </Markdown>
                </GlassCard>
              </Animated.View>

              {/* Come Back */}
              <Animated.View entering={FadeIn.delay(1000).duration(500)} style={styles.comeBackContainer}>
                <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.comeBackText, { color: colors.onSurfaceVariant }]}>
                  Come back tomorrow for a new reading!
                </Text>
              </Animated.View>
            </View>

          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 100 },
  header: { marginBottom: 28, alignItems: "center" },
  title: { fontSize: 34, fontWeight: "800", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, opacity: 0.8, textAlign: "center" },
  content: { flex: 1, alignItems: "center" },
  
  // Large Screen Layout overrides
  contentLarge: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 40,
    maxWidth: 1200,
    marginHorizontal: "auto",
  },
  leftColumn: {
    alignItems: "center",
  },
  leftColumnLarge: {
    flex: 0.4,
    minWidth: 320,
    position: "sticky",
    top: 24,
  },
  rightColumn: {
    alignItems: "center",
    width: "100%",
  },
  rightColumnLarge: {
    flex: 0.6,
    alignItems: "flex-start",
  },

  // Loading
  loadingContainer: { alignItems: "center", paddingTop: 100 },
  loadingEmoji: { fontSize: 48, marginBottom: 16 },
  loadingText: { fontSize: 16, fontStyle: "italic" },

  // Card Back (not drawn yet)
  cardBack: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 0,
    marginBottom: 24,
  },
  cardBackGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    gap: 24,
  },
  cardBackStar: {
    fontSize: 32,
    color: "#E8D5B7",
    textShadowColor: "rgba(232, 213, 183, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  cardBackDesign: {
    fontSize: 28,
    color: "#E8D5B7",
    letterSpacing: 8,
    textShadowColor: "rgba(232, 213, 183, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  cardBackBorder: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1.5,
    borderColor: "rgba(232, 213, 183, 0.3)",
    borderRadius: 14,
  },
  instructionContainer: { alignItems: "center", marginBottom: 32 },
  instructionText: { fontSize: 18, fontWeight: "600", marginBottom: 6, textAlign: "center" },
  instructionSubtext: { fontSize: 14, opacity: 0.7, textAlign: "center" },
  buttonContainer: { marginTop: "auto", marginBottom: 20 },

  // Card Image (drawn)
  cardImageContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: "#f5f0e8",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },

  // Card Name
  cardName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  // Card Meaning
  meaningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  meaningLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  meaningText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 4,
    paddingHorizontal: 8,
  },

  // Divider
  divider: {
    width: 60,
    height: 1.5,
    marginVertical: 20,
    borderRadius: 1,
  },

  // Personalized Reading
  readingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  readingHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  readingCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
    width: "100%",
  },
  readingText: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: -0.1,
  },

  // Come Back
  comeBackContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  comeBackText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
