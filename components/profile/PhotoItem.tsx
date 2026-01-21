import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/lib/theme";
import { useQuery } from "convex/react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

interface PhotoItemProps {
  storageId: string;
  style?: object;
}

export function PhotoItem({ storageId, style }: PhotoItemProps) {
  const { colors } = useAppTheme();
  
  // Check if it's already a displayable URI (local file, http, or https)
  const isDirectUri = 
    storageId.startsWith("file://") || 
    storageId.startsWith("content://") ||
    storageId.startsWith("http://") ||
    storageId.startsWith("https://");
  
  const url = useQuery(
    api.files.getUrl,
    isDirectUri ? "skip" : { storageId: storageId as Id<"_storage"> }
  );

  const displayUri = isDirectUri ? storageId : url;

  if (!displayUri) {
    return (
      <View style={[styles.loading, style, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return <Image source={{ uri: displayUri }} style={[styles.image, style]} />;
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  loading: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
