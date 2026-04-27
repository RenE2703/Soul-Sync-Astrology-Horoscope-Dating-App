import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/lib/theme";

export function WebTopNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Separate routes into left/center and right (profile)
  const mainRoutes = state.routes.filter((route) => route.name !== "profile");
  const profileRoute = state.routes.find((route) => route.name === "profile");

  const renderTab = (route: any, isProfile = false) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const isFocused = state.index === state.routes.indexOf(route);

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const color = isFocused ? colors.primary : colors.onSurfaceVariant;
    const IconName =
      route.name === "index"
        ? isFocused
          ? "flame"
          : "flame-outline"
        : route.name === "matches"
        ? isFocused
          ? "sparkles"
          : "sparkles-outline"
        : route.name === "chat"
        ? isFocused
          ? "chatbubble"
          : "chatbubble-outline"
        : route.name === "tarot"
        ? isFocused
          ? "moon"
          : "moon-outline"
        : route.name === "profile"
        ? isFocused
          ? "person"
          : "person-outline"
        : "ellipse";

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={[styles.tabButton, isProfile && styles.profileTab]}
      >
        {IconName !== "none" && <Ionicons name={IconName as any} size={24} color={color} />}
        <Text style={[styles.tabLabel, { color }]}>{label as string}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.outline,
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
    >
      <View style={styles.navContent}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <Ionicons name="heart" size={28} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.primary }]}>SoulSync</Text>
        </View>

        {/* Main Navigation Links */}
        <View style={styles.mainNav}>
          {mainRoutes.map((route) => renderTab(route))}
        </View>

        {/* Profile Link (Right Aligned) */}
        <View style={styles.rightNav}>
          {profileRoute && renderTab(profileRoute, true)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 24,
    zIndex: 100,
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    marginHorizontal: "auto",
    width: "100%",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 40,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  mainNav: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  rightNav: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  profileTab: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
