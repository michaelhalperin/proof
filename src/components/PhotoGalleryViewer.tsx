import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Photo } from "../db/database";
import { formatTimestamp } from "../utils/dateUtils";
import { getFontFamily } from "../config/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PhotoGalleryViewerProps {
  visible: boolean;
  photos: Photo[];
  initialIndex: number;
  recordCreatedAt?: number;
  onClose: () => void;
}

export default function PhotoGalleryViewer({
  visible,
  photos,
  initialIndex,
  recordCreatedAt,
  onClose,
}: PhotoGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentPhoto = photos[currentIndex];

  // Calculate photo info (location comes from record, not photo)
  const photoInfo = currentPhoto
    ? {
        location: null, // Location is stored in record, not individual photos
        timestamp: recordCreatedAt,
      }
    : null;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < photos.length) {
      setCurrentIndex(index);
    }
  };

  if (!visible || photos.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {currentIndex + 1} / {photos.length}
          </Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowInfo(!showInfo)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showInfo ? "information" : "information-outline"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Photo Gallery */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoContainer}>
              <ScrollView
                minimumZoomScale={1}
                maximumZoomScale={5}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.zoomContainer}
              >
                <Image
                  source={{ uri: photo.fileUri }}
                  style={styles.photo}
                  contentFit="contain"
                  transition={200}
                />
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={handlePrevious}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>
        )}

        {currentIndex < photos.length - 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Info Overlay */}
        {showInfo && photoInfo && (
          <View style={styles.infoOverlay}>
            <View style={styles.infoContent}>
              {photoInfo.timestamp && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color="#fff" />
                  <Text style={styles.infoText}>
                    {formatTimestamp(photoInfo.timestamp)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  scrollView: {
    flex: 1,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  infoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    flex: 1,
  },
});
