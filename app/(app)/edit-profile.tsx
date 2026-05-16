import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCloseButton, GlassHeader, GlassOption } from "@/components/glass";
import {
  DateOfBirthPicker,
  DistanceSlider,
  DISTANCE_STEPS,
  calculateAgeFromDate,
  getDefaultDateOfBirth,
  getDistanceIndex,
} from "@/components/preferences";
import { PhotoItem } from "@/components/profile";
import { KeyboardAwareView } from "@/components/ui";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import {
  GENDERS,
  INTEREST_NAMES,
  LOOKING_FOR_OPTIONS,
  MAX_INTERESTS,
  arrayToLookingFor,
  lookingForToArray,
  type Gender,
  type LookingForOption,
} from "@/lib/constants";
import { AdaptiveGlassView, supportsGlassEffect } from "@/lib/glass";
import { hapticButtonPress, hapticSelection, hapticSuccess } from "@/lib/haptics";
import {
  requestAndGetLocation,
  reverseGeocode,
  searchLocations,
  useReverseGeocode,
  type GeoSearchResult,
  type LocationInfo,
} from "@/lib/location";
import { AppColors, useAppTheme } from "@/lib/theme";

interface PhotoEntry {
  uri: string;
  storageId?: string;
  isNew: boolean;
}

// Quick-select Vietnamese locations — appended to search input for street-level precision
const POPULAR_LOCATIONS = [
  { label: "TP. HCM", query: "Ho Chi Minh" },
  { label: "Hà Nội", query: "Hanoi" },
  { label: "Đà Nẵng", query: "Da Nang" },
  { label: "Bình Dương", query: "Binh Duong" },
  { label: "Đồng Nai", query: "Dong Nai" },
  { label: "Cần Thơ", query: "Can Tho" },
  { label: "Hải Phòng", query: "Hai Phong" },
  { label: "Nha Trang", query: "Nha Trang" },
  { label: "Huế", query: "Hue" },
  { label: "Vũng Tàu", query: "Vung Tau" },
  { label: "Đông Hòa", query: "Dong Hoa, Binh Duong" },
  { label: "Gò Vấp", query: "Go Vap, Ho Chi Minh" },
  { label: "Thủ Đức", query: "Thu Duc, Ho Chi Minh" },
  { label: "Dĩ An", query: "Di An, Binh Duong" },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { clerkUser } = useCurrentUser();
  const insets = useSafeAreaInsets();

  // Use raw query to get storage IDs instead of resolved URLs
  const profile = useQuery(
    api.users.getByClerkIdRaw,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const { pickImage: pickImageFromLibrary, uploadPhoto } = usePhotoPicker();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dating preferences state
  const [dateOfBirth, setDateOfBirth] = useState<Date>(getDefaultDateOfBirth());
  const [gender, setGender] = useState<Gender>("woman");
  const [lookingFor, setLookingFor] = useState<LookingForOption>("everyone");
  
  // Location state - use index for slider, derive actual value
  const [distanceIndex, setDistanceIndex] = useState(1); // Default to 30 km (index 1)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationInfoOverride, setLocationInfoOverride] = useState<LocationInfo | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [storedLocationName, setStoredLocationName] = useState<string | null>(null);

  // Manual location search state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);

  // Reverse geocode the location - use stored name first, then override, then hook
  const { locationInfo: geocodedInfo } = useReverseGeocode(
    storedLocationName || locationInfoOverride ? null : location
  );
  const locationInfo = storedLocationName 
    ? { city: null, region: null, country: null, displayName: storedLocationName } 
    : (locationInfoOverride || geocodedInfo);

  const maxDistance = DISTANCE_STEPS[distanceIndex];

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
      // Dating preferences
      if (profile.dateOfBirth) {
        setDateOfBirth(new Date(profile.dateOfBirth));
      } else if (profile.age) {
        // Compute approximate dateOfBirth from age for legacy data
        const approxDob = new Date();
        approxDob.setFullYear(approxDob.getFullYear() - profile.age);
        setDateOfBirth(approxDob);
      }
      if (profile.gender) {
        setGender(profile.gender as Gender);
      }
      if (profile.lookingFor) {
        setLookingFor(arrayToLookingFor(profile.lookingFor));
      }
      // Location settings - convert saved value to index
      setDistanceIndex(getDistanceIndex(profile.maxDistance));
      setLocation(profile.location ?? null);
      setStoredLocationName(profile.locationName ?? null);
    }
  }, [profile]);

  const toggleInterest = (interest: string) => {
    hapticSelection();
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length < MAX_INTERESTS) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const pickImage = async () => {
    if (photos.length >= 6) return;

    const uri = await pickImageFromLibrary();
    if (uri) {
      setPhotos((prev) => [...prev, { uri, isNew: true }]);
    }
  };

  const removePhoto = (index: number) => {
    hapticSelection();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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
        dateOfBirth: dateOfBirth.getTime(),
        gender,
        lookingFor: lookingForToArray(lookingFor),
        interests,
        photos: photoIds,
        maxDistance,
        ...(location && { location }),
        ...(locationInfo?.displayName && locationInfo.displayName !== "Unknown location" && {
          locationName: locationInfo.displayName,
        }),
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
        setLocationInfoOverride(result.locationInfo);
        setStoredLocationName(null); // Clear stored name so fresh geocoded name is used
        setSearchResults([]);
        setShowManualInput(false);
        hapticSuccess();
      } else {
        Alert.alert(
          "Không thể lấy vị trí tự động",
          "GPS không hoạt động. Bạn có thể nhập địa chỉ/tên quận để thiết lập vị trí chính xác.",
          [
            { text: "Nhập thủ công", onPress: () => setShowManualInput(true) },
            { text: "Thử lại", style: "cancel" },
          ]
        );
      }
    } catch (error) {
      console.error("Failed to update location:", error);
      Alert.alert(
        "Lỗi",
        "Không thể lấy vị trí. Bạn có thể nhập địa chỉ thay thế.",
        [
          { text: "Nhập thủ công", onPress: () => setShowManualInput(true) },
          { text: "OK", style: "cancel" },
        ]
      );
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleQuickSelect = (query: string) => {
    hapticButtonPress();
    const currentText = manualQuery.trim();
    if (currentText && !currentText.includes(",")) {
      setManualQuery(`${currentText}, ${query}`);
    } else {
      setManualQuery(query);
    }
    setShowManualInput(true);
  };

  const handleSearch = async () => {
    if (!manualQuery.trim()) return;

    hapticButtonPress();
    setIsSearching(true);
    setSearchResults([]);

    try {
      const results = await searchLocations(manualQuery.trim());
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        Alert.alert(
          "Không tìm thấy",
          `Không tìm thấy "${manualQuery}". Thử nhập chi tiết hơn, ví dụ: "Tân Lập, Đông Hòa, Bình Dương"`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: GeoSearchResult) => {
    hapticButtonPress();
    setIsUpdatingLocation(true);

    try {
      const info = await reverseGeocode(result.location);
      
      setLocation(result.location);
      setLocationInfoOverride(info);
      setStoredLocationName(null);
      setSearchResults([]);
      setShowManualInput(false);
      hapticSuccess();
    } catch (error) {
      console.error("Select result failed:", error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const renderSearchResult = ({ item }: { item: GeoSearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surfaceVariant }]}
      onPress={() => handleSelectResult(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons
          name={
            item.type === "city" || item.type === "town"
              ? "business"
              : item.type === "state" || item.type === "province"
                ? "map"
                : "location"
          }
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.resultTextContainer}>
        <Text
          style={[styles.resultName, { color: colors.onBackground }]}
          numberOfLines={2}
        >
          {item.displayName}
        </Text>
        <Text style={[styles.resultCoords, { color: colors.onSurfaceVariant }]}>
          {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
          {" · "}
          {item.type}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

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

            {/* Date of Birth Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                DATE OF BIRTH ({calculateAgeFromDate(dateOfBirth)} years old)
              </Text>
              <DateOfBirthPicker 
                value={dateOfBirth} 
                onChange={setDateOfBirth} 
                showAgeCard={false}
              />
            </View>

            {/* Gender Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>I AM A</Text>
              <View style={styles.optionsRow}>
                {GENDERS.map((g) => (
                  <View key={g.value} style={styles.optionHalf}>
                    <GlassOption
                      icon={g.icon}
                      label={g.label}
                      onPress={() => setGender(g.value)}
                      selected={gender === g.value}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Looking For Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>INTERESTED IN</Text>
              <View style={styles.optionsColumn}>
                {LOOKING_FOR_OPTIONS.map((option) => (
                  <GlassOption
                    key={option.value}
                    icon={option.icon}
                    label={option.label}
                    onPress={() => setLookingFor(option.value)}
                    selected={lookingFor === option.value}
                  />
                ))}
              </View>
            </View>

            {/* Interests Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                INTERESTS ({interests.length}/{MAX_INTERESTS})
              </Text>
              <View style={styles.interestsGrid}>
                {INTEREST_NAMES.map((interest) => {
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
                  <View style={styles.locationInfoContainer}>
                    <Text style={styles.statusEmoji}>
                      {location ? "✅" : "📍"}
                    </Text>
                    <View style={styles.locationTextContainer}>
                      <Text style={[styles.locationLabel, { color: colors.onBackground }]}>
                        {location ? "Đã thiết lập vị trí" : "Chưa thiết lập vị trí"}
                      </Text>
                      {location && locationInfo?.displayName && (
                        <Text style={[styles.locationCity, { color: colors.primary }]}>
                          {locationInfo.displayName}
                        </Text>
                      )}
                      {location && (
                        <Text style={[styles.coordsText, { color: colors.onSurfaceVariant }]}>
                          📐 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </AdaptiveGlassView>

              {/* GPS Button */}
              {!location && (
                <TouchableOpacity
                  style={[styles.enableButton, { backgroundColor: colors.primary }]}
                  onPress={handleUpdateLocation}
                  disabled={isUpdatingLocation}
                  activeOpacity={0.8}
                >
                  {isUpdatingLocation ? (
                    <View style={styles.buttonRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.enableButtonText}>Đang lấy vị trí...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonRow}>
                      <Ionicons name="navigate" size={20} color="#FFFFFF" />
                      <Text style={styles.enableButtonText}>Lấy vị trí tự động (GPS)</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Manual Search Input */}
              {!location && (
                <>
                  {!showManualInput ? (
                    <TouchableOpacity
                      style={[styles.manualButton, { borderColor: colors.outline }]}
                      onPress={() => setShowManualInput(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="search" size={20} color={colors.onSurfaceVariant} />
                      <Text style={[styles.manualButtonText, { color: colors.onSurfaceVariant }]}>
                        Hoặc nhập địa chỉ / tên quận
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.manualInputContainer}>
                      <Text style={[styles.searchHint, { color: colors.onSurfaceVariant }]}>
                        📍 Nhập tên đường + quận/thành phố để tọạ độ chính xác nhất
                      </Text>
                      <View
                        style={[
                          styles.searchRow,
                          { borderColor: colors.primary, backgroundColor: colors.surfaceVariant },
                        ]}
                      >
                        <Ionicons name="search" size={20} color={colors.onSurfaceVariant} />
                        <TextInput
                          style={[styles.searchInput, { color: colors.onBackground }]}
                          placeholder="VD: Tan Lap, Dong Hoa, Binh Duong"
                          placeholderTextColor={colors.onSurfaceVariant + "80"}
                          value={manualQuery}
                          onChangeText={setManualQuery}
                          autoFocus
                          returnKeyType="search"
                          onSubmitEditing={handleSearch}
                        />
                        {manualQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setManualQuery("")}>
                            <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.searchButton,
                          {
                            backgroundColor: manualQuery.trim()
                              ? colors.primary
                              : colors.surfaceVariant,
                          },
                        ]}
                        onPress={handleSearch}
                        disabled={isSearching || !manualQuery.trim()}
                        activeOpacity={0.8}
                      >
                        {isSearching ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text
                            style={[
                              styles.searchButtonText,
                              {
                                color: manualQuery.trim() ? "#FFFFFF" : colors.onSurfaceVariant,
                              },
                            ]}
                          >
                            Tìm kiếm
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.resultsContainer}>
                  <Text style={[styles.resultsTitle, { color: colors.onSurfaceVariant }]}>
                    Chọn vị trí chính xác nhất:
                  </Text>
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(_, i) => i.toString()}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  />
                </View>
              )}

              {/* Quick-select popular cities */}
              {!location && showManualInput && searchResults.length === 0 && !isSearching && (
                <View style={styles.quickSelectContainer}>
                  <Text style={[styles.quickSelectTitle, { color: colors.onSurfaceVariant }]}>
                    Bấm để điền vào ô tìm kiếm (gõ tên đường trước, rồi bấm):
                  </Text>
                  <View style={styles.quickSelectGrid}>
                    {POPULAR_LOCATIONS.map((loc) => (
                      <TouchableOpacity
                        key={loc.query}
                        style={[styles.quickSelectChip, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => handleQuickSelect(loc.query)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickSelectText, { color: colors.onBackground }]}>
                          {loc.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Change location button */}
              {location && (
                <TouchableOpacity
                  style={[styles.changeButton, { borderColor: colors.outline }]}
                  onPress={() => {
                    setLocation(null);
                    setLocationInfoOverride(null);
                    setStoredLocationName(null);
                    setSearchResults([]);
                    setShowManualInput(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={[styles.changeButtonText, { color: colors.primary }]}>
                    Đổi vị trí
                  </Text>
                </TouchableOpacity>
              )}

              {/* Distance Slider */}
              <View style={styles.distanceSection}>
                <DistanceSlider value={distanceIndex} onChange={setDistanceIndex} />
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
    maxWidth: 800,
    marginHorizontal: "auto",
    width: "100%",
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
  // Preference options
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionHalf: {
    flex: 1,
  },
  optionsColumn: {
    gap: 12,
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
  locationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  locationCity: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
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
    maxWidth: 800,
    marginHorizontal: "auto",
    width: "100%",
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
  statusEmoji: { fontSize: 24 },
  coordsText: { fontSize: 12, fontWeight: "400", opacity: 0.7, fontFamily: "monospace", marginTop: 2 },
  enableButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  enableButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  manualInputContainer: {
    gap: 10,
    marginBottom: 12,
  },
  searchHint: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchButton: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    gap: 10,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  resultTextContainer: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  resultCoords: {
    fontSize: 11,
    fontWeight: "400",
    fontFamily: "monospace",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  quickSelectContainer: {
    gap: 10,
    marginBottom: 12,
  },
  quickSelectTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  quickSelectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickSelectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
