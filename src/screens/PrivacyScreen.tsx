import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";

export default function PrivacyScreen() {
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
          <Ionicons
            name="shield-checkmark"
            size={48}
            color="#000"
            style={styles.headerIcon}
          />
          <Text style={styles.title}>Privacy & Security</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.featureCard}>
            <Ionicons name="cloud-offline-outline" size={32} color="#000" />
            <Text style={styles.featureTitle}>Offline-First</Text>
            <Text style={styles.featureText}>
              Proof works completely offline. No network requests, no cloud
              sync, no data transmission. All your records are stored locally on
              your device.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="lock-closed-outline" size={32} color="#000" />
            <Text style={styles.featureTitle}>Local-Only Storage</Text>
            <Text style={styles.featureText}>
              All data is stored in SQLite database and local file system. Your
              proof records never leave your device. No third-party services, no
              external storage, no backups to cloud.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="eye-off-outline" size={32} color="#000" />
            <Text style={styles.featureTitle}>No Tracking</Text>
            <Text style={styles.featureText}>
              Proof does not collect, track, or analyze any data. No analytics,
              no telemetry, no user behavior tracking. What happens on your
              device stays on your device.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="key-outline" size={32} color="#000" />
            <Text style={styles.featureTitle}>Tamper-Evident</Text>
            <Text style={styles.featureText}>
              Each proof record uses SHA-256 cryptographic hashing to ensure
              integrity. Any modification to a record will be detected through
              hash verification. Your evidence is cryptographically protected.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="document-lock-outline" size={32} color="#000" />
            <Text style={styles.featureTitle}>Immutable Records</Text>
            <Text style={styles.featureText}>
              Once saved, proof records cannot be edited or deleted (except
              today's record). This ensures the integrity of your evidence log
              over time and prevents tampering.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="person-outline" size={32} color="#000" />
            <Text style={styles.featureTitle}>Account Security</Text>
            <Text style={styles.featureText}>
              Your account credentials are stored securely using device-level
              encryption. Passwords are hashed using SHA-256. All authentication
              happens locally on your device.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is fundamental to Proof. We don't collect anything
            because we can't. Your data is yours, always.
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
    marginBottom: 40,
    paddingVertical: 20,
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  section: {
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
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    fontFamily: getFontFamily("regular"),
    color: "#333",
    lineHeight: 22,
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
