import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";

interface UsePhotoPickerOptions {
  maxPhotos?: number;
  aspect?: [number, number];
  quality?: number;
}

interface UsePhotoPickerReturn {
  /** Pick an image from the library. Returns the local URI or null if cancelled/failed. */
  pickImage: () => Promise<string | null>;
  /** Upload a local image URI to Convex storage. Returns the storage ID. */
  uploadPhoto: (uri: string) => Promise<string>;
  /** Upload multiple photos in parallel. Returns array of storage IDs. */
  uploadPhotos: (uris: string[]) => Promise<string[]>;
}

/**
 * Hook for picking and uploading photos to Convex storage.
 * Encapsulates permission handling, image picker, and upload logic.
 */
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
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });

    const { storageId } = await uploadResponse.json();
    return storageId;
  }, [generateUploadUrl]);

  const uploadPhotos = useCallback(
    (uris: string[]): Promise<string[]> => Promise.all(uris.map(uploadPhoto)),
    [uploadPhoto]
  );

  return { pickImage, uploadPhoto, uploadPhotos };
}
