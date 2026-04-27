import { Platform, StyleSheet, View } from "react-native";
import { useAppTheme } from "@/lib/theme";

export function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={[styles.webRoot, { backgroundColor: "#f0f2f5" }]}>
      <View style={[styles.appContainer, { backgroundColor: colors.background, borderColor: colors.outline }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  appContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 800,
    height: "100%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
});
