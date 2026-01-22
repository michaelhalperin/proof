import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";
import { SUPPORT_EMAIL } from "../config/env";
import { useAuth } from "../context/AuthContext";
import { sendSupportEmail } from "../utils/emailService";

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleEmailPress = async () => {
    if (!subject.trim() && !message.trim()) {
      Alert.alert("Missing Information", "Please enter a subject or message.");
      return;
    }

    try {
      setSending(true);
      await sendSupportEmail(subject, message, user?.email);
      
      // Success - email was sent (either to SUPPORT_EMAIL or user's email as fallback)
      // The email itself will contain a note if it was sent to user's email
      Alert.alert(
        "Message Sent",
        "Your support request has been sent. Check your email inbox for confirmation."
      );
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending support email:", error);
      const errorMessage = error?.message || "";
      
      // Show helpful message for Resend limitation
      if (
        errorMessage.includes("only send testing emails") ||
        errorMessage.includes("verify a domain")
      ) {
        Alert.alert(
          "Email Service Limitation",
          "Resend's free tier only allows sending to your verified email address. Your support request has been sent to your email inbox instead. To send directly to support, verify a domain in Resend."
        );
      } else {
        Alert.alert(
          "Error",
          errorMessage || "Failed to send support message. Please try again."
        );
      }
    } finally {
      setSending(false);
    }
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
                style={[
                  styles.button,
                  styles.sendButton,
                  sending && styles.sendButtonDisabled,
                ]}
                onPress={handleEmailPress}
                activeOpacity={0.7}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.sendButtonText}>Send Email</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

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
  sendButtonDisabled: {
    opacity: 0.5,
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
