import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import {
  formatDateKey,
  formatTimestamp,
  getTodayDateKey,
} from "../utils/dateUtils";
import { getRecord, getPhotos, deleteRecord } from "../db/database";
import { verifyRecordIntegrity } from "../utils/hashing";
import { generatePDF } from "../utils/pdfExport";
import {
  sharePhoto,
  sharePhotos,
  shareText,
  sharePDF,
} from "../utils/shareUtils";
import { Record, Photo } from "../db/database";
import { parseLocation } from "../utils/location";
import * as FileSystem from "expo-file-system/legacy";
import { getFontFamily } from "../config/theme";

type DayDetailScreenRouteProp = RouteProp<RootStackParamList, "DayDetail">;
type DayDetailScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function DayDetailScreen() {
  const route = useRoute<DayDetailScreenRouteProp>();
  const navigation = useNavigation<DayDetailScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { dateKey } = route.params;

  const [record, setRecord] = useState<Record | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [integrityVerified, setIntegrityVerified] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showHash, setShowHash] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const isToday = dateKey === getTodayDateKey();

  useEffect(() => {
    loadRecord();
  }, [dateKey]);

  const loadRecord = async () => {
    try {
      const loadedRecord = await getRecord(dateKey);
      const loadedPhotos = await getPhotos(dateKey);

      if (!loadedRecord) {
        Alert.alert("Not Found", "Proof record not found for this date.");
        navigation.goBack();
        return;
      }

      // Verify photo files exist and log file URIs
      const verifiedPhotos = await Promise.all(
        loadedPhotos.map(async (photo) => {
          try {
            const fileInfo = await FileSystem.getInfoAsync(photo.fileUri);
            if (!fileInfo.exists) {
              console.warn("Photo file not found:", photo.fileUri);
            }
          } catch (error) {
            console.error("Error checking photo file:", photo.fileUri, error);
          }
          return photo;
        })
      );

      setRecord(loadedRecord);
      setPhotos(verifiedPhotos);

      // Verify integrity
      const canonicalPhotos = loadedPhotos.map((p) => ({
        id: p.id,
        mimeType: p.mimeType,
        sha256: p.sha256,
        sortIndex: p.sortIndex,
      }));

      const verified = await verifyRecordIntegrity(
        loadedRecord.recordHash,
        loadedRecord.dateKey,
        loadedRecord.createdAt,
        loadedRecord.note,
        canonicalPhotos
      );

      setIntegrityVerified(verified);
    } catch (error) {
      console.error("Error loading record:", error);
      Alert.alert("Error", "Failed to load proof record.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!record) return;

    if (Platform.OS === "ios") {
      const options: string[] = [];
      if (photos.length > 0) {
        options.push("Share Photos");
        if (photos.length > 1) {
          options.push("Share All Photos");
        }
      }
      if (record.note) {
        options.push("Share Note");
      }
      options.push("Share as PDF");
      options.push("Cancel");

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        async (buttonIndex) => {
          const option = options[buttonIndex];
          if (option === "Cancel") return;
          await handleShareOption(option);
        }
      );
    } else {
      // Android: Show Alert with options
      const alertOptions: Array<{
        text: string;
        onPress?: () => void;
        style?: "cancel";
      }> = [];
      if (photos.length > 0) {
        alertOptions.push({
          text: "Share Photos",
          onPress: () => handleShareOption("Share Photos"),
        });
        if (photos.length > 1) {
          alertOptions.push({
            text: "Share All Photos",
            onPress: () => handleShareOption("Share All Photos"),
          });
        }
      }
      if (record.note) {
        alertOptions.push({
          text: "Share Note",
          onPress: () => handleShareOption("Share Note"),
        });
      }
      alertOptions.push({
        text: "Share as PDF",
        onPress: () => handleShareOption("Share as PDF"),
      });
      alertOptions.push({ text: "Cancel", style: "cancel" });

      Alert.alert("Share Proof", "Choose how to share", alertOptions);
    }
  };

  const handleShareOption = async (option: string) => {
    if (!record) return;

    setExporting(true);
    try {
      if (option === "Share Photos" && photos.length > 0) {
        // Share first photo
        await sharePhoto(photos[0].fileUri);
      } else if (option === "Share All Photos" && photos.length > 0) {
        // Share all photos (will share first one, then user can share others)
        const photoUris = photos.map((p) => p.fileUri);
        await sharePhotos(photoUris);
      } else if (option === "Share Note" && record.note) {
        await shareText(record.note, record);
      } else if (option === "Share as PDF") {
        const photoUris = photos.map((p) => p.fileUri);
        const pdfUri = await generatePDF(record, photos, photoUris);
        // Copy PDF with proper filename
        const fileName = `proof-${dateKey}.pdf`;
        const newUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: pdfUri,
          to: newUri,
        });
        await sharePDF(newUri);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    await handleShareOption("Share as PDF");
  };

  const handleEdit = () => {
    navigation.replace("LogToday", { editMode: true, dateKey });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Proof",
      "Are you sure you want to delete today's proof? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              // Delete photo files
              for (const photo of photos) {
                try {
                  const fileInfo = await FileSystem.getInfoAsync(photo.fileUri);
                  if (fileInfo.exists) {
                    await FileSystem.deleteAsync(photo.fileUri, {
                      idempotent: true,
                    });
                  }
                } catch (error) {
                  console.warn("Error deleting photo file:", error);
                }
              }

              // Delete from database
              await deleteRecord(dateKey);

              Alert.alert("Success", "Proof deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => {
                    // Go back to previous screen (usually Home or History)
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      // Fallback: navigate to MainTabs if can't go back
                      navigation.navigate("MainTabs");
                    }
                  },
                },
              ]);
            } catch (error) {
              console.error("Error deleting proof:", error);
              Alert.alert("Error", "Failed to delete proof. Please try again.");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !record) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const getImageUri = (fileUri: string): string => {
    if (
      !fileUri.startsWith("file://") &&
      !fileUri.startsWith("http://") &&
      !fileUri.startsWith("https://") &&
      !fileUri.startsWith("content://")
    ) {
      return `file://${fileUri}`;
    }
    return fileUri;
  };

  const handlePhotoPress = (photoUri: string) => {
    setSelectedPhoto(photoUri);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Created At Header with Integrity Icon */}
        <View style={styles.dateHeader}>
          <View style={styles.dateInfo}>
            <Text style={styles.createdLabel}>Created</Text>
            <Text style={styles.createdText}>
              {formatTimestamp(record.createdAt)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.integrityContainer}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.integrityIcon,
                integrityVerified === true
                  ? styles.integrityIconVerified
                  : styles.integrityIconFailed,
              ]}
            >
              <Text
                style={[
                  styles.integritySymbol,
                  integrityVerified === true
                    ? styles.integritySymbolVerified
                    : styles.integritySymbolFailed,
                ]}
              >
                {integrityVerified === true ? "✓" : "✕"}
              </Text>
            </View>
            <Text
              style={[
                styles.integrityLabel,
                integrityVerified === true
                  ? styles.integrityLabelVerified
                  : styles.integrityLabelFailed,
              ]}
            >
              {integrityVerified === true ? "Verified" : "Failed"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note - Highlighted */}
        {record.note && (
          <View style={styles.noteSection}>
            <Text style={styles.noteText}>{record.note}</Text>
          </View>
        )}

        {/* Metadata - Tags and Location */}
        {(record.tags || record.location) && (
          <View style={styles.metadataSection}>
            {record.tags &&
              (() => {
                try {
                  const tagsArray = JSON.parse(record.tags);
                  return Array.isArray(tagsArray) && tagsArray.length > 0 ? (
                    <View style={styles.metadataRow}>
                      <Ionicons
                        name="pricetags-outline"
                        size={18}
                        color="#666"
                      />
                      <View style={styles.tagsContainer}>
                        {tagsArray.map((tag: string, index: number) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null;
                } catch {
                  return null;
                }
              })()}
            {record.location &&
              (() => {
                const loc = parseLocation(record.location);
                return loc ? (
                  <View style={styles.metadataRow}>
                    <Ionicons name="location-outline" size={18} color="#666" />
                    <Text style={styles.locationText}>
                      {loc.address ||
                        `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(
                          4
                        )}`}
                    </Text>
                  </View>
                ) : null;
              })()}
          </View>
        )}

        {/* Photos - Highlighted */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <View style={styles.photosGrid}>
              {photos.map((photo) => {
                const imageUri = getImageUri(photo.fileUri);
                return (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoWrapper}
                    onPress={() => handlePhotoPress(imageUri)}
                    onLongPress={async () => {
                      Alert.alert(
                        "Photo Options",
                        "What would you like to do?",
                        [
                          {
                            text: "View Full Size",
                            onPress: () => handlePhotoPress(imageUri),
                          },
                          {
                            text: "Share Photo",
                            onPress: async () => {
                              setExporting(true);
                              try {
                                await sharePhoto(photo.fileUri);
                              } catch (error) {
                                console.error("Error sharing photo:", error);
                                Alert.alert(
                                  "Error",
                                  "Failed to share photo. Please try again."
                                );
                              } finally {
                                setExporting(false);
                              }
                            },
                          },
                          { text: "Cancel", style: "cancel" as const },
                        ]
                      );
                    }}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.photoThumbnail}
                      contentFit="cover"
                      onError={(error) => {
                        console.error("Image load error:", photo.id, error);
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Hash - Collapsible */}
        <View style={styles.hashSection}>
          <TouchableOpacity
            style={styles.hashToggle}
            onPress={() => setShowHash(!showHash)}
            activeOpacity={0.7}
          >
            <Text style={styles.hashToggleText}>
              {showHash ? "Hide Hash" : "Show Hash"}
            </Text>
            <Text style={styles.hashToggleIcon}>{showHash ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {showHash && (
            <View style={styles.hashContainer}>
              <Text style={styles.hashValue} selectable>
                {record.recordHash}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {isToday && (
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.footerButton, styles.editBtn]}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <Text style={[styles.footerButtonText, styles.editBtnText]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.deleteBtn]}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.8}
            >
              {deleting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={[styles.footerButtonText, styles.deleteBtnText]}>
                  Delete
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.exportBtn,
            exporting && styles.buttonDisabled,
          ]}
          onPress={handleShare}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.footerButtonText, styles.exportBtnText]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullImage}
                contentFit="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  // Date Header with Integrity
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    padding: 18,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  dateInfo: {
    flex: 1,
    marginRight: 16,
  },
  createdLabel: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  createdText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#1a1a1a",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  integrityContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  integrityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  integrityIconVerified: {
    backgroundColor: "#e8f5e9",
  },
  integrityIconFailed: {
    backgroundColor: "#ffebee",
  },
  integritySymbol: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  integritySymbolVerified: {
    color: "#2e7d32",
  },
  integritySymbolFailed: {
    color: "#c62828",
  },
  integrityLabel: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  integrityLabelVerified: {
    color: "#2e7d32",
  },
  integrityLabelFailed: {
    color: "#c62828",
  },
  // Note Section - Highlighted
  noteSection: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 3,
    borderLeftColor: "#000000",
  },
  noteText: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
    color: "#1a1a1a",
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  // Photos Section - Highlighted
  photosSection: {
    marginBottom: 32,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  photoWrapper: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 4,
  },
  photoThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  // Hash Section - Collapsible
  hashSection: {
    marginBottom: 32,
  },
  hashToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  hashToggleText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    color: "#666666",
    letterSpacing: 0,
  },
  hashToggleIcon: {
    fontSize: 10,
    color: "#666666",
  },
  hashContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  hashValue: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#1a1a1a",
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  metadataSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  locationText: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    flex: 1,
  },
  // Footer Actions
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  editBtn: {
    backgroundColor: "#424242",
    borderWidth: 1.5,
    borderColor: "#424242",
  },
  editBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    letterSpacing: 0.2,
  },
  deleteBtn: {
    backgroundColor: "#d32f2f",
    borderWidth: 1.5,
    borderColor: "#d32f2f",
  },
  deleteBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    letterSpacing: 0.2,
  },
  exportBtn: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  exportBtnText: {
    color: "#ffffff",
    fontFamily: getFontFamily("semiBold"),
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    color: "#000000",
    letterSpacing: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Full Screen Image Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
});
