import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Proof</Text>
          </View>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Offline-first evidence logging</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is Proof?</Text>
          <Text style={styles.sectionText}>
            Proof is a privacy-first, offline evidence logging app that helps
            you create tamper-evident records of your daily activities. Each
            record includes photos, notes, timestamps, and cryptographic hashes
            to verify integrity.
          </Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#000" />
              <Text style={styles.featureTitle}>Privacy First</Text>
            </View>
            <Text style={styles.featureText}>
              Your data stays on this device. No accounts, no cloud, no network
              required. Proof is completely offline-first and gives you complete
              control over your records.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="key" size={24} color="#000" />
              <Text style={styles.featureTitle}>Tamper-Evident</Text>
            </View>
            <Text style={styles.featureText}>
              Each proof record includes a SHA-256 cryptographic hash that
              verifies the integrity of your data. If any part of the record is
              modified, the hash will change and the integrity check will fail.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="lock-closed" size={24} color="#000" />
              <Text style={styles.featureTitle}>Immutable Records</Text>
            </View>
            <Text style={styles.featureText}>
              Once you save a proof for a day, it cannot be edited or deleted
              (except today's record). This ensures the integrity of your
              evidence log over time.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="share" size={24} color="#000" />
              <Text style={styles.featureTitle}>Export & Share</Text>
            </View>
            <Text style={styles.featureText}>
              Export any proof record as a PDF that includes all photos, notes,
              timestamps, and the integrity hash. Share photos, notes, or full
              PDFs as needed while keeping your original records secure on your
              device.
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Data Storage</Text>
            <Text style={styles.infoText}>
              All data is stored locally on your device using SQLite for
              metadata and the file system for photos. No external services, no
              cloud storage.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is fundamental. Your data is yours, always.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
    paddingVertical: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    letterSpacing: -1,
  },
  version: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  tagline: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    fontFamily: getFontFamily("regular"),
  },
  featureSection: {
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginLeft: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    fontFamily: getFontFamily("regular"),
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: getFontFamily("regular"),
  },
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: getFontFamily("regular", true),
  },
});
