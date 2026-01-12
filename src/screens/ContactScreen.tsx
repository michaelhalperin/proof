import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";
import Constants from "expo-constants";

const SUPPORT_EMAIL = "support@proof.app";
const SUPPORT_URL = Constants.expoConfig?.extra?.SUPPORT_URL || "https://proof.app/support";

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleEmailPress = () => {
    const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || "Proof Support Request")}&body=${encodeURIComponent(message || "")}`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            "Email Not Available",
            "Please email us directly at " + SUPPORT_EMAIL
          );
        }
      })
      .catch((err) => {
        Alert.alert("Error", "Failed to open email client");
        console.error("Error opening email:", err);
      });
  };

  const handleSupportWebsitePress = () => {
    Linking.canOpenURL(SUPPORT_URL)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(SUPPORT_URL);
        } else {
          Alert.alert("Error", "Unable to open support website");
        }
      })
      .catch((err) => {
        Alert.alert("Error", "Failed to open support website");
        console.error("Error opening URL:", err);
      });
  };

  const handleClear = () => {
    setSubject("");
    setMessage("");
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="mail-outline" size={48} color="#000" />
          <Text style={styles.title}>Contact & Support</Text>
          <Text style={styles.subtitle}>
            We're here to help. Get in touch with us through any of the methods below.
          </Text>
        </View>

        {/* Email Contact Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail" size={24} color="#000" />
              <Text style={styles.cardTitle}>Email Support</Text>
            </View>
            <Text style={styles.cardDescription}>
              Send us an email directly. We typically respond within 24-48 hours.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="What can we help you with?"
                placeholderTextColor="#999"
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your question or issue..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{message.length}/1000</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.sendButton]}
                onPress={handleEmailPress}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendButtonText}>Send Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emailDisplay}>
              <Text style={styles.emailLabel}>Direct Email:</Text>
              <TouchableOpacity
                onPress={() => {
                  const emailUrl = `mailto:${SUPPORT_EMAIL}`;
                  Linking.openURL(emailUrl).catch(() => {
                    Alert.alert("Error", "Unable to open email client");
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.emailAddress}>{SUPPORT_EMAIL}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Support Website Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="globe-outline" size={24} color="#000" />
              <Text style={styles.cardTitle}>Support Website</Text>
            </View>
            <Text style={styles.cardDescription}>
              Visit our support website for documentation, FAQs, and additional resources.
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleSupportWebsitePress}
              activeOpacity={0.7}
            >
              <Text style={styles.linkButtonText}>Visit Support Website</Text>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Response Time</Text>
              <Text style={styles.infoText}>
                We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, please clearly mark your email as "Urgent" in the subject line.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Before Contacting Us</Text>
              <Text style={styles.infoText}>
                Check the Help & FAQ section in Settings for answers to common questions. This may help you find a solution faster.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for using Proof. We appreciate your feedback and are committed to providing the best possible support.
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
    marginBottom: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontFamily: getFontFamily("regular"),
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    fontFamily: getFontFamily("regular"),
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: getFontFamily("regular"),
    color: "#000",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
    fontFamily: getFontFamily("regular"),
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
  },
  sendButton: {
    backgroundColor: "#000",
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#fff",
  },
  emailDisplay: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  emailLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontFamily: getFontFamily("regular"),
  },
  emailAddress: {
    fontSize: 15,
    color: "#007AFF",
    fontFamily: getFontFamily("regular"),
    textDecorationLine: "underline",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 15,
    color: "#007AFF",
    fontFamily: getFontFamily("regular"),
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    fontFamily: getFontFamily("regular"),
    lineHeight: 20,
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
    fontFamily: getFontFamily("regular"),
  },
});
