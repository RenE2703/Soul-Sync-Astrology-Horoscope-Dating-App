import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Token cache for Clerk to persist auth tokens securely
export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === "web") {
        return null;
      }
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === "web") {
        return;
      }
      return SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("SecureStore save error: ", error);
    }
  },
  async clearToken(key: string) {
    try {
      if (Platform.OS === "web") {
        return;
      }
      return SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("SecureStore clear error: ", error);
    }
  },
};
