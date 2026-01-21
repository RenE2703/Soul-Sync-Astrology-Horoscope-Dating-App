import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCloseButton, GlassHeader } from "@/components/glass";
import { PhotoItem } from "@/components/profile";
import { KeyboardAwareView } from "@/components/ui";
import { api } from "@/convex/_generated/api";
import { AdaptiveGlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress, hapticSelection, hapticSuccess } from "@/lib/haptics";
import { requestAndGetLocation } from "@/lib/location";
import { AppColors, useAppTheme } from "@/lib/theme";

const INTERESTS = [
  "Travel", "Music", "Fitness", "Photography", "Cooking", "Reading",
  "Movies", "Art", "Gaming", "Hiking", "Yoga", "Dancing",
  "Coffee", "Wine", "Pets", "Sports", "Nature", "Beach", "Fashion", "Foodie",
];

interface PhotoEntry {
  uri: string;
  storageId?: string;
  isNew: boolean;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user: clerkUser } = useUser();
  const insets = useSafeAreaInsets();

  // Use raw query to get storage IDs instead of resolved URLs
  const profile = useQuery(
    api.users.getByClerkIdRaw,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Location state
  const [maxDistance, setMaxDistance] = useState(25);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setInterests(profile.interests || []);
      // Photos are stored as URLs
      setPhotos(
        (profile.photos || []).map((photoUrl) => ({
          uri: photoUrl,
          isNew: false,
        }))
      );
      // Location settings
      setMaxDistance(profile.maxDistance ?? 25);
      setLocation(profile.location ?? null);
    }
  }, [profile]);

  const toggleInterest = (interest: string) => {
    hapticSelection();
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length < 6) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const pickImage = async () => {
    if (photos.length >= 6) return;

    hapticSelection();

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [
        ...prev,
        { uri: result.assets[0].uri, isNew: true },
      ]);
      hapticButtonPress();
    }
  };

  const removePhoto = (index: number) => {
    hapticSelection();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (uri: string): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });

    const { storageId } = await uploadResponse.json();
    return storageId; // Store the storage ID, not the URL
  };

  const handleSave = async () => {
    if (!profile?._id) return;

    setIsSaving(true);
    try {
      // Upload new photos to get storage IDs, keep existing storage IDs/URLs as-is
      const photoIds = await Promise.all(
        photos.map(async (photo) => {
          if (photo.isNew) {
            // New photo - upload and get storage ID
            return uploadPhoto(photo.uri);
          }
          // Existing photo - keep the storage ID or URL as-is
          return photo.uri;
        })
      );

      await updateProfile({
        id: profile._id,
        name,
        bio,
        interests,
        photos: photoIds,
        maxDistance,
        ...(location && { location }),
      });

      hapticSuccess();
      router.back();
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    hapticButtonPress();
    router.back();
  };

  const handleUpdateLocation = async () => {
    hapticButtonPress();
    setIsUpdatingLocation(true);
    try {
      const result = await requestAndGetLocation();
      if (result.location) {
        setLocation(result.location);
        hapticSuccess();
      }
    } catch (error) {
      console.error("Failed to update location:", error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleDistanceChange = (value: number) => {
    const rounded = Math.round(value);
    if (rounded !== maxDistance) {
      hapticSelection();
      setMaxDistance(rounded);
    }
  };

  const isValid = name.trim().length >= 2 && bio.trim().length >= 10 && interests.length >= 3 && photos.length >= 1;

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </>
    );
  }

  // Calculate header height for content inset
  const headerHeight = insets.top + 12 + 44 + 16; // top inset + padding + button height + bottom padding
  const footerHeight = 16 + 56 + insets.bottom + 16; // top padding + button height + bottom inset + extra

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAwareView style={styles.keyboardView}>
          {/* ScrollView - extends behind header and footer */}
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: headerHeight, paddingBottom: footerHeight }
            ]}
            contentInsetAdjustmentBehavior="never"
          >
            {/* Photos Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>PHOTOS</Text>
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoSlot}
                    onPress={() => removePhoto(index)}
                    activeOpacity={0.9}
                  >
                    {/* PhotoItem handles both URLs and storage IDs */}
                    <PhotoItem storageId={photo.uri} style={styles.photoImage} />
                    <View style={styles.removeButton}>
                      <Ionicons name="close-circle" size={26} color={AppColors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
                {photos.length < 6 && (
                  <TouchableOpacity
                    style={[styles.photoSlot, styles.addPhotoSlot, { borderColor: colors.outline }]}
                    onPress={pickImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={32} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Name Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>NAME</Text>
              <AdaptiveGlassView
                style={styles.inputContainer}
                fallbackStyle={styles.inputFallback}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.input, { color: colors.onBackground }]}
                />
              </AdaptiveGlassView>
            </View>

            {/* Bio Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>BIO</Text>
              <AdaptiveGlassView
                style={styles.textAreaContainer}
                fallbackStyle={styles.inputFallback}
              >
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people about yourself..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.textArea, { color: colors.onBackground }]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </AdaptiveGlassView>
            </View>

            {/* Interests Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                INTERESTS ({interests.length}/6)
              </Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest);

                  return (
                    <TouchableOpacity 
                      key={interest} 
                      onPress={() => toggleInterest(interest)}
                      activeOpacity={0.8}
                    >
                      <AdaptiveGlassView
                        style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                        tintColor={isSelected ? colors.primary : undefined}
                        fallbackColor={isSelected ? colors.primary : colors.surfaceVariant}
                        fallbackStyle={[
                          styles.interestChipFallback,
                          { borderColor: isSelected ? colors.primary : colors.outline },
                        ]}
                      >
                        <Text style={[
                          styles.interestText, 
                          { color: isSelected ? "#FFFFFF" : colors.onBackground }
                        ]}>
                          {interest}
                        </Text>
                      </AdaptiveGlassView>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                LOCATION
              </Text>
              
              {/* Location Status */}
              <AdaptiveGlassView
                style={styles.locationCard}
                fallbackStyle={styles.inputFallback}
              >
                <View style={styles.locationStatus}>
                  <View style={styles.locationInfo}>
                    <Ionicons 
                      name={location ? "location" : "location-outline"} 
                      size={24} 
                      color={location ? colors.primary : colors.onSurfaceVariant} 
                    />
                    <Text style={[styles.locationText, { color: colors.onBackground }]}>
                      {location ? "Location enabled" : "Location not set"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.updateLocationButton, { backgroundColor: colors.primary }]}
                    onPress={handleUpdateLocation}
                    disabled={isUpdatingLocation}
                    activeOpacity={0.8}
                  >
                    {isUpdatingLocation ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.updateLocationText}>
                        {location ? "Update" : "Enable"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </AdaptiveGlassView>

              {/* Distance Slider */}
              <View style={styles.distanceSection}>
                <View style={styles.distanceHeader}>
                  <Text style={[styles.distanceLabel, { color: colors.onSurfaceVariant }]}>
                    Maximum distance
                  </Text>
                  <Text style={[styles.distanceValue, { color: colors.primary }]}>
                    {maxDistance} miles
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={100}
                  value={maxDistance}
                  onValueChange={handleDistanceChange}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.surfaceVariant}
                  thumbTintColor={colors.primary}
                  step={5}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderEndLabel, { color: colors.onSurfaceVariant }]}>
                    5 mi
                  </Text>
                  <Text style={[styles.sliderEndLabel, { color: colors.onSurfaceVariant }]}>
                    100 mi
                  </Text>
                </View>
              </View>
            </View>

          </ScrollView>

          {/* Header - Positioned absolutely */}
          <GlassHeader
            title="Edit Profile"
            leftContent={<GlassCloseButton onPress={handleCancel} />}
            centerTitle
          />

          {/* Footer - Positioned absolutely */}
          <AdaptiveGlassView
            style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
            fallbackColor={colors.background}
            fallbackStyle={styles.footerFallback}
          >
            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid || isSaving}
              activeOpacity={0.9}
            >
              {supportsGlassEffect ? (
                <AdaptiveGlassView 
                  style={styles.saveButtonInner}
                  tintColor={isValid ? colors.primary : undefined}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </AdaptiveGlassView>
              ) : (
                <LinearGradient
                  colors={isValid ? [AppColors.primary, "#FF4458"] : [colors.surfaceVariant, colors.surfaceVariant]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonInner}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.saveButtonText, !isValid && { color: colors.onSurfaceVariant }]}>
                      Save Changes
                    </Text>
                  )}
                </LinearGradient>
              )}
            </TouchableOpacity>
          </AdaptiveGlassView>
        </KeyboardAwareView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  keyboardView: { 
    flex: 1,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
  },
  // Content
  scrollView: { 
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: { 
    marginBottom: 28,
  },
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  // Photos
  photosGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12,
  },
  photoSlot: {
    width: "30%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  addPhotoSlot: {
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  photoImage: { 
    width: "100%", 
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
  },
  // Inputs
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  inputFallback: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  input: {
    fontSize: 17,
    fontWeight: "500",
  },
  textAreaContainer: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  textArea: {
    fontSize: 17,
    fontWeight: "400",
    minHeight: 100,
    lineHeight: 24,
  },
  // Interests
  interestsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 10,
  },
  interestChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  interestChipSelected: {
    // Glass tint handles the color
  },
  interestChipFallback: {
    borderWidth: 1.5,
  },
  interestText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Location
  locationCard: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  updateLocationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  updateLocationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  distanceSection: {
    marginTop: 8,
  },
  distanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  sliderEndLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Footer
  footer: { 
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 10,
  },
  footerFallback: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  saveButton: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#FF4458",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonInner: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
});
