import { useMutation } from "convex/react";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useCallback } from "react";
import { Platform } from "react-native";

import { api } from "@/convex/_generated/api";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";

interface UsePhotoPickerOptions {
  maxPhotos?: number;
  aspect?: [number, number];
  quality?: number;
}

interface UsePhotoPickerReturn {
  pickImage: () => Promise<string | null>;
  uploadPhoto: (uri: string) => Promise<string>;
  uploadPhotos: (uris: string[]) => Promise<string[]>;
}

export function usePhotoPicker(options: UsePhotoPickerOptions = {}): UsePhotoPickerReturn {
  const { maxPhotos = 6, aspect = [3, 4], quality = 0.8 } = options;

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const pickImage = useCallback(async (): Promise<string | null> => {
    hapticSelection();

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality,
    });

    if (!result.canceled && result.assets[0]) {
      hapticButtonPress();
      return result.assets[0].uri;
    }

    return null;
  }, [aspect, quality]);

  const uploadPhoto = useCallback(async (uri: string): Promise<string> => {
    let uploadUrl: string;

    try {
      console.log("[uploadPhoto] Generating upload URL via Convex...");
      uploadUrl = await generateUploadUrl();
      console.log("[uploadPhoto] Upload URL generated successfully:", uploadUrl);
    } catch (e) {
      console.error("[uploadPhoto] Convex generateUploadUrl failed:", e);
      throw new Error("generateUploadUrl failed: " + e);
    }

    const extension = uri.split(".").pop()?.toLowerCase() || "jpeg";
    const mimeTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
    const contentType = mimeTypes[extension] || "image/jpeg";

    try {
      if (Platform.OS === "web") {
        console.log(`[uploadPhoto] Starting Web fetch upload. URI: ${uri}, ContentType: ${contentType}`);
        // For web, ImagePicker returns a blob/data URI, we fetch it first to get the actual Blob
        const response = await fetch(uri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": contentType,
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status ${uploadResponse.status}: ${await uploadResponse.text()}`);
        }

        const parsed = await uploadResponse.json();
        console.log("[uploadPhoto] Web Upload successful, storageId:", parsed.storageId);
        return parsed.storageId;
      } else {
        console.log(`[uploadPhoto] Starting Native FileSystem upload. URI: ${uri}, ContentType: ${contentType}`);
        
        // Use standard upload API for Native
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
          httpMethod: "POST",
          // @ts-ignore
          uploadType: FileSystem.FileSystemUploadType ? FileSystem.FileSystemUploadType.BINARY_CONTENT : 0,
          headers: { "Content-Type": contentType },
        });

        console.log("[uploadPhoto] FileSystem upload completed with status:", uploadResult.status);

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
        }

        const parsed = JSON.parse(uploadResult.body);
        console.log("[uploadPhoto] Native Upload successful, storageId:", parsed.storageId);
        return parsed.storageId;
      }
    } catch (error) {
      console.error("[uploadPhoto] Upload execution failed:", error);
      throw error;
    }
  }, [generateUploadUrl]);

  const uploadPhotos = useCallback(
    (uris: string[]): Promise<string[]> => Promise.all(uris.map(uploadPhoto)),
    [uploadPhoto]
  );

  return { pickImage, uploadPhoto, uploadPhotos };
}
