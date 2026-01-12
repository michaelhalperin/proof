import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

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
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            At Proof, we are committed to protecting your privacy. This Privacy Policy explains how we handle your data and what information we collect (or rather, don't collect) when you use our application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>None.</Text> Proof is designed to operate entirely offline and does not collect, transmit, or store any personal information on external servers.
          </Text>
          <Text style={styles.sectionText}>
            The only information collected is stored locally on your device:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Account credentials (email, hashed password) - stored locally on your device</Text>
            <Text style={styles.listItem}>• Proof records (notes, photos, timestamps, metadata) - stored locally on your device</Text>
            <Text style={styles.listItem}>• App preferences and settings - stored locally on your device</Text>
          </View>
          <Text style={styles.sectionText}>
            All of this data remains on your device and is never transmitted to us or any third party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. No Data Collection</Text>
          <Text style={styles.sectionText}>
            Proof does not collect, track, or transmit:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Personal identification information</Text>
            <Text style={styles.listItem}>• Usage analytics or telemetry</Text>
            <Text style={styles.listItem}>• Device information or identifiers</Text>
            <Text style={styles.listItem}>• Location data (unless you explicitly add it to a record, stored locally only)</Text>
            <Text style={styles.listItem}>• Behavioral tracking data</Text>
            <Text style={styles.listItem}>• Crash reports or error logs (unless you explicitly send them)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Storage</Text>
          <Text style={styles.sectionText}>
            All data created and stored in Proof is stored locally on your device using:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• SQLite database for metadata (proof records, account information)</Text>
            <Text style={styles.listItem}>• Device file system for photos and media files</Text>
            <Text style={styles.listItem}>• Secure storage for account credentials and sensitive preferences</Text>
          </View>
          <Text style={styles.sectionText}>
            Your data never leaves your device. We have no access to your proof records, photos, notes, or any other information stored in the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Email Service</Text>
          <Text style={styles.sectionText}>
            Proof uses email services only for essential account functions:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Email verification PIN codes sent during account creation</Text>
            <Text style={styles.listItem}>• Password reset PIN codes sent when you request a password reset</Text>
          </View>
          <Text style={styles.sectionText}>
            These emails are sent using a third-party email service provider (Resend). Your email address is only used for account verification and password recovery. We do not use your email address for marketing, promotional, or any other purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
          <Text style={styles.sectionText}>
            Proof uses minimal third-party services:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Email delivery service (Resend) - only for account verification and password reset emails</Text>
          </View>
          <Text style={styles.sectionText}>
            No third-party services have access to your proof records, photos, or any personal data stored in the App. Email addresses are only shared with the email service provider for the sole purpose of sending verification and password reset emails.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Permissions</Text>
          <Text style={styles.sectionText}>
            Proof requests the following device permissions:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Camera - to take photos for proof records (optional)</Text>
            <Text style={styles.listItem}>• Photo Library - to select existing photos for proof records (optional)</Text>
            <Text style={styles.listItem}>• Location - to optionally tag records with location data (optional)</Text>
            <Text style={styles.listItem}>• Notifications - to send daily reminder notifications (optional)</Text>
          </View>
          <Text style={styles.sectionText}>
            All permissions are optional and requested only when you choose to use features that require them. You can revoke these permissions at any time through your device settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement security measures to protect your locally stored data:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Passwords are hashed using SHA-256 cryptographic hashing</Text>
            <Text style={styles.listItem}>• Account credentials stored using device-level secure storage</Text>
            <Text style={styles.listItem}>• Proof records use SHA-256 hashing for tamper-evidence</Text>
          </View>
          <Text style={styles.sectionText}>
            However, you are responsible for maintaining the security of your device. If your device is lost, stolen, or compromised, your data may be at risk. We recommend using device encryption, screen locks, and other security features provided by your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Data Backup and Recovery</Text>
          <Text style={styles.sectionText}>
            Proof stores all data locally on your device. We do not provide cloud backup services. You are responsible for:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Backing up your device data</Text>
            <Text style={styles.listItem}>• Exporting important proof records as PDFs if desired</Text>
            <Text style={styles.listItem}>• Managing your device's backup settings</Text>
          </View>
          <Text style={styles.sectionText}>
            If you uninstall the App or lose access to your device, your data may be permanently lost. We are not responsible for data loss.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Proof is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us through the Support section.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Your Rights</Text>
          <Text style={styles.sectionText}>
            Since all your data is stored locally on your device, you have complete control over it:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• You can view all your data within the App</Text>
            <Text style={styles.listItem}>• You can export records as PDFs</Text>
            <Text style={styles.listItem}>• You can delete your account and all associated data at any time</Text>
            <Text style={styles.listItem}>• You can delete individual proof records (today's record only)</Text>
          </View>
          <Text style={styles.sectionText}>
            To delete your account and all data, use the "Delete Account" feature in Settings. This action is permanent and cannot be undone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to This Privacy Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last Updated" date at the top of this document. Your continued use of the App after such modifications constitutes acceptance of the updated Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us through the Support section in the App's Settings.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is fundamental to Proof. We don't collect anything because we can't. Your data is yours, always.
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
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontFamily: getFontFamily("regular"),
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    fontFamily: getFontFamily("regular"),
    marginBottom: 8,
  },
  bold: {
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
  },
  listContainer: {
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    fontFamily: getFontFamily("regular"),
    marginBottom: 6,
  },
  footer: {
    marginTop: 32,
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
