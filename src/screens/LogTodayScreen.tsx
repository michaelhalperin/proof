import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";
import { getTodayDateKey } from "../utils/dateUtils";
import {
  recordExists,
  insertRecord,
  getRecord,
  getPhotos,
  updateRecord,
} from "../db/database";
import {
  copyPhotoToAppStorage,
  getMimeTypeFromUri,
  getExtensionFromUri,
} from "../utils/fileSystem";
import { computeRecordHash } from "../utils/hashing";
import {
  getCurrentLocation,
  stringifyLocation,
  parseLocation,
} from "../utils/location";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import { getFontFamily } from "../config/theme";
import { getRandomPrompt, arePromptsEnabled } from "../utils/prompts";

type LogTodayScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LogToday"
>;
type LogTodayScreenRouteProp = RouteProp<RootStackParamList, "LogToday">;

interface PhotoPreview {
  uri: string;
  id: string;
}

export default function LogTodayScreen() {
  const navigation = useNavigation<LogTodayScreenNavigationProp>();
  const route = useRoute<LogTodayScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { editMode, dateKey: editDateKey } = route.params || {};
  const todayDateKey = editDateKey || getTodayDateKey();
  const isEditMode = editMode && editDateKey === todayDateKey;

  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [location, setLocation] = useState<string | null>(null);

  // Predefined common tags
  const predefinedTags = [
    "work",
    "personal",
    "event",
    "family",
    "travel",
    "health",
    "finance",
    "legal",
    "receipt",
    "document",
    "important",
  ];
  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [journalPrompt, setJournalPrompt] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // Scroll to top when screen comes into focus
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      const loadExistingData = async () => {
        // Load journal prompt if enabled and not editing
        if (!isEditMode) {
          const enabled = await arePromptsEnabled();
          if (enabled) {
            const prompt = await getRandomPrompt();
            if (prompt) {
              setJournalPrompt(prompt);
            }
          }
        }

        if (isEditMode) {
          // Load existing record for editing
          setLoading(true);
          try {
            const existingRecord = await getRecord(todayDateKey);
            const existingPhotos = await getPhotos(todayDateKey);

            if (existingRecord) {
              setNote(existingRecord.note);
              setPhotos(
                existingPhotos.map((p) => ({
                  uri: p.fileUri,
                  id: p.id,
                }))
              );
              // Load tags (stored as JSON array string)
              if (existingRecord.tags) {
                try {
                  const tagsArray = JSON.parse(existingRecord.tags);
                  setTags(Array.isArray(tagsArray) ? tagsArray : []);
                } catch {
                  setTags([]);
                }
              } else {
                setTags([]);
              }
              setLocation(existingRecord.location || null);
            }
          } catch (error) {
            console.error("Error loading existing record:", error);
          } finally {
            setLoading(false);
          }
        } else {
          // Check if record exists (should not for new entries)
          const exists = await recordExists(todayDateKey);
          if (exists) {
            navigation.replace("DayDetail", { dateKey: todayDateKey });
          }
        }
      };
      loadExistingData();
    }, [todayDateKey, navigation, isEditMode])
  );

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Camera and photo library permissions are needed to add photos. You can still create a proof with just a note."
      );
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleTakePhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert("Maximum Photos", "You can add up to 3 photos per proof.");
      return;
    }

    try {
      // Check camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "Proof needs camera access to take photos. Please grant camera permission in your device settings.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoId = Crypto.randomUUID();
        setPhotos([...photos, { uri: result.assets[0].uri, id: photoId }]);
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      Alert.alert(
        "Camera Error",
        error?.message ||
          "Failed to take photo. Please check camera permissions and try again."
      );
    }
  };

  const handleChooseFromLibrary = async () => {
    if (photos.length >= 3) {
      Alert.alert("Maximum Photos", "You can add up to 3 photos per proof.");
      return;
    }

    try {
      // Check media library permissions first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Photo Library Permission Required",
          "Proof needs photo library access to select photos. Please grant photo library permission in your device settings.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoId = Crypto.randomUUID();
        setPhotos([...photos, { uri: result.assets[0].uri, id: photoId }]);
      }
    } catch (error: any) {
      console.error("Photo library error:", error);
      Alert.alert(
        "Photo Library Error",
        error?.message ||
          "Failed to select photo. Please check permissions and try again."
      );
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleAddLocation = async () => {
    setLocationLoading(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(stringifyLocation(loc));
      } else {
        Alert.alert(
          "Location",
          "Could not get your location. Please check location permissions."
        );
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location. Please check permissions.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRemoveLocation = () => {
    setLocation(null);
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && trimmed.length > 0) {
      setTags([...tags, trimmed]);
      setCustomTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const canSave = note.trim().length > 0 || photos.length > 0;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        // Update existing record
        const existingRecord = await getRecord(todayDateKey);
        if (!existingRecord) {
          Alert.alert("Error", "Record not found for editing.");
          setSaving(false);
          return;
        }

        // Get existing photos to delete old files
        const existingPhotos = await getPhotos(todayDateKey);
        const existingPhotoIds = new Set(existingPhotos.map((p) => p.id));

        // Delete old photo files that are no longer in the list
        for (const existingPhoto of existingPhotos) {
          if (!photos.find((p) => p.id === existingPhoto.id)) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(
                existingPhoto.fileUri
              );
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(existingPhoto.fileUri, {
                  idempotent: true,
                });
              }
            } catch (error) {
              console.warn("Error deleting old photo file:", error);
            }
          }
        }

        // Process photos - keep existing ones, copy new ones
        const photoHashes = await Promise.all(
          photos.map(async (photo, index) => {
            // If photo already exists (has existing fileUri), use it
            if (existingPhotoIds.has(photo.id)) {
              const existingPhoto = existingPhotos.find(
                (p) => p.id === photo.id
              );
              if (existingPhoto) {
                return {
                  id: photo.id,
                  mimeType: existingPhoto.mimeType,
                  sha256: existingPhoto.sha256,
                  sortIndex: index,
                  fileUri: existingPhoto.fileUri,
                };
              }
            }

            // New photo - copy to storage
            const ext = getExtensionFromUri(photo.uri);
            const { fileUri, sha256 } = await copyPhotoToAppStorage(
              photo.uri,
              photo.id,
              ext
            );
            return {
              id: photo.id,
              mimeType: getMimeTypeFromUri(photo.uri),
              sha256,
              sortIndex: index,
              fileUri,
            };
          })
        );

        // Build canonical photos array for hashing
        const canonicalPhotos = photoHashes.map(
          ({ id, mimeType, sha256, sortIndex }) => ({
            id,
            mimeType,
            sha256,
            sortIndex,
          })
        );

        // Use original createdAt for hash computation
        const createdAt = existingRecord.createdAt;

        // Compute new record hash
        const recordHash = await computeRecordHash(
          todayDateKey,
          createdAt,
          note,
          canonicalPhotos
        );

        // Process tags (already an array)
        const tagsJson = tags.length > 0 ? JSON.stringify(tags) : undefined;

        // Update record
        await updateRecord(
          {
            dateKey: todayDateKey,
            createdAt: existingRecord.createdAt,
            note: note.trim(),
            recordHash,
            algo: "SHA-256",
            tags: tagsJson,
            ...(location !== null && { location: location as string }),
          },
          photoHashes.map(({ id, fileUri, mimeType, sha256, sortIndex }) => ({
            id,
            dateKey: todayDateKey,
            fileUri,
            mimeType,
            sha256,
            sortIndex,
          }))
        );

        // After updating, go back to DayDetail (use goBack if coming from edit, otherwise replace)
        // Check if we can go back (came from DayDetail), otherwise replace
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace("DayDetail", { dateKey: todayDateKey });
        }
      } else {
        // Create new record
        const exists = await recordExists(todayDateKey);
        if (exists && !isEditMode) {
          navigation.replace("DayDetail", { dateKey: todayDateKey });
          return;
        }

        const createdAt = Date.now();

        // Copy photos to app storage and compute hashes
        const photoHashes = await Promise.all(
          photos.map(async (photo, index) => {
            const ext = getExtensionFromUri(photo.uri);
            const { fileUri, sha256 } = await copyPhotoToAppStorage(
              photo.uri,
              photo.id,
              ext
            );
            return {
              id: photo.id,
              mimeType: getMimeTypeFromUri(photo.uri),
              sha256,
              sortIndex: index,
              fileUri,
            };
          })
        );

        // Build canonical photos array for hashing
        const canonicalPhotos = photoHashes.map(
          ({ id, mimeType, sha256, sortIndex }) => ({
            id,
            mimeType,
            sha256,
            sortIndex,
          })
        );

        // Compute record hash
        const recordHash = await computeRecordHash(
          todayDateKey,
          createdAt,
          note,
          canonicalPhotos
        );

        // Process tags (already an array)
        const tagsJson = tags.length > 0 ? JSON.stringify(tags) : undefined;

        // Insert record
        await insertRecord(
          {
            dateKey: todayDateKey,
            createdAt,
            note: note.trim(),
            recordHash,
            algo: "SHA-256",
            tags: tagsJson,
            ...(location !== null && { location: location as string }),
          },
          photoHashes.map(({ id, fileUri, mimeType, sha256, sortIndex }) => ({
            id,
            dateKey: todayDateKey,
            fileUri,
            mimeType,
            sha256,
            sortIndex,
          }))
        );

        navigation.replace("DayDetail", { dateKey: todayDateKey });
      }
    } catch (error) {
      console.error("Error saving proof:", error);
      Alert.alert("Error", "Failed to save proof. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator
          size="large"
          color="#000"
          style={styles.loadingIndicator}
        />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.content}>
        {/* Journal Prompt */}
        {journalPrompt && !isEditMode && (
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Ionicons name="bulb-outline" size={20} color="#666" />
              <Text style={styles.promptLabel}>Daily Reflection</Text>
            </View>
            <Text style={styles.promptText}>{journalPrompt}</Text>
            <TouchableOpacity
              style={styles.promptDismiss}
              onPress={() => setJournalPrompt(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          maxLength={500}
          placeholder={journalPrompt || "Enter your note here..."}
          placeholderTextColor="#999"
          value={note}
          onChangeText={setNote}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{note.length}/500</Text>

        <Text style={styles.label}>Tags (optional)</Text>

        {/* Selected Tags */}
        {tags.length > 0 && (
          <View style={styles.selectedTagsContainer}>
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedTag}
                onPress={() => handleRemoveTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectedTagText}>{tag}</Text>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#666"
                  style={styles.tagRemoveIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Predefined Tags */}
        <View style={styles.predefinedTagsContainer}>
          <Text style={styles.predefinedTagsLabel}>Common Tags</Text>
          <View style={styles.predefinedTagsGrid}>
            {predefinedTags.map((tag) => {
              const isSelected = tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.predefinedTag,
                    isSelected && styles.predefinedTagSelected,
                  ]}
                  onPress={() => handleToggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.predefinedTagText,
                      isSelected && styles.predefinedTagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#fff"
                      style={styles.tagCheckIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Tag Input */}
        <View style={styles.customTagContainer}>
          <TextInput
            style={styles.customTagInput}
            placeholder="Add custom tag..."
            value={customTagInput}
            onChangeText={setCustomTagInput}
            maxLength={30}
            onSubmitEditing={handleAddCustomTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addCustomTagButton,
              !customTagInput.trim() && styles.addCustomTagButtonDisabled,
            ]}
            onPress={handleAddCustomTag}
            disabled={!customTagInput.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Location (optional)</Text>
        {location ? (
          <View style={styles.locationContainer}>
            <View style={styles.locationInfo}>
              {(() => {
                const loc = parseLocation(location);
                return loc ? (
                  <>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.locationText} numberOfLines={2}>
                      {loc.address ||
                        `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(
                          4
                        )}`}
                    </Text>
                  </>
                ) : null;
              })()}
            </View>
            <TouchableOpacity
              style={styles.removeLocationButton}
              onPress={handleRemoveLocation}
            >
              <Ionicons name="close-circle" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addLocationButton}
            onPress={handleAddLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#000" />
                <Text style={styles.addLocationText}>Add Location</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Photos (up to 3)</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={handleTakePhoto}
            disabled={photos.length >= 3}
          >
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={handleChooseFromLibrary}
            disabled={photos.length >= 3}
          >
            <Text style={styles.photoButtonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.photosContainer}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoPreview}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(photo.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!canSave || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? "Update Proof" : "Save Proof"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  loadingIndicator: {
    marginTop: 100,
  },
  content: {
    padding: 20,
  },
  promptCard: {
    backgroundColor: "#fff9e6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffe5a3",
    position: "relative",
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    color: "#333",
    lineHeight: 22,
    fontStyle: "italic",
  },
  promptDismiss: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    minHeight: 120,
    backgroundColor: "#fafafa",
  },
  charCount: {
    fontSize: 12,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  photoButtonText: {
    fontSize: 16,
    fontFamily: getFontFamily("medium"),
    color: "#000",
    fontWeight: "500",
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  photoWrapper: {
    width: "30%",
    aspectRatio: 1,
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    flex: 1,
  },
  removeLocationButton: {
    marginLeft: 8,
  },
  addLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
    gap: 8,
  },
  addLocationText: {
    fontSize: 14,
    fontFamily: getFontFamily("medium"),
    color: "#000",
    fontWeight: "500",
  },
  selectedTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedTagText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  tagRemoveIcon: {
    marginLeft: 2,
  },
  predefinedTagsContainer: {
    marginBottom: 16,
  },
  predefinedTagsLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  predefinedTagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  predefinedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  predefinedTagSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  predefinedTagText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  predefinedTagTextSelected: {
    color: "#fff",
  },
  tagCheckIcon: {
    marginLeft: 2,
  },
  customTagContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    backgroundColor: "#fafafa",
  },
  addCustomTagButton: {
    backgroundColor: "#000",
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addCustomTagButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
});
