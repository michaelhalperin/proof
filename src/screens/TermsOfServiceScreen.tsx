import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";

export default function TermsOfServiceScreen() {
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
          <Ionicons name="document-text" size={48} color="#000" />
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing or using Proof ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            Proof is a privacy-first, offline evidence logging application that allows users to create tamper-evident records with notes, photos, timestamps, and cryptographic hashes. The App operates entirely offline and stores all data locally on your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            To use Proof, you must create an account with a valid email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          <Text style={styles.sectionText}>
            You agree to use Proof only for lawful purposes and in accordance with these Terms. You are solely responsible for the content you create and store using the App. You must not:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Use the App to store illegal, harmful, or offensive content</Text>
            <Text style={styles.listItem}>• Attempt to reverse engineer, decompile, or disassemble the App</Text>
            <Text style={styles.listItem}>• Interfere with or disrupt the App's functionality</Text>
            <Text style={styles.listItem}>• Use the App in any manner that could damage, disable, or impair the App</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Storage and Privacy</Text>
          <Text style={styles.sectionText}>
            All data created and stored using Proof is stored locally on your device. We do not access, collect, or transmit your data. You are solely responsible for:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Backing up your data</Text>
            <Text style={styles.listItem}>• Protecting your device from unauthorized access</Text>
            <Text style={styles.listItem}>• Maintaining the security of your account credentials</Text>
          </View>
          <Text style={styles.sectionText}>
            If you delete the App or lose access to your device, your data may be permanently lost. We are not responsible for data loss under any circumstances.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Record Integrity</Text>
          <Text style={styles.sectionText}>
            Proof uses cryptographic hashing to verify the integrity of your records. While we take measures to ensure tamper-evidence, we do not guarantee that records cannot be modified outside of the App's intended functionality. The integrity verification is provided as a feature, not as a warranty.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Immutability Policy</Text>
          <Text style={styles.sectionText}>
            Once saved, proof records cannot be edited or deleted (except today's record). This immutability is designed to preserve evidence integrity but is not a legal guarantee. You acknowledge that:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Past records cannot be modified through the App interface</Text>
            <Text style={styles.listItem}>• Only today's record may be edited or deleted</Text>
            <Text style={styles.listItem}>• This immutability does not prevent device-level data modification</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disclaimers</Text>
          <Text style={styles.sectionText}>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Warranties of merchantability, fitness for a particular purpose, or non-infringement</Text>
            <Text style={styles.listItem}>• Warranties that the App will be uninterrupted, secure, or error-free</Text>
            <Text style={styles.listItem}>• Warranties regarding the accuracy, reliability, or availability of the App</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Your use or inability to use the App</Text>
            <Text style={styles.listItem}>• Any unauthorized access to or use of your device or data</Text>
            <Text style={styles.listItem}>• Any errors or omissions in the App's functionality</Text>
            <Text style={styles.listItem}>• Any loss or corruption of data</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Indemnification</Text>
          <Text style={styles.sectionText}>
            You agree to indemnify and hold harmless the App developers from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the App, violation of these Terms, or infringement of any rights of another party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Modifications to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last Updated" date at the top of this document. Your continued use of the App after such modifications constitutes acceptance of the updated Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.sectionText}>
            You may terminate your account at any time by deleting your account through the App's settings. We reserve the right to suspend or terminate your access to the App at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.sectionText}>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the App is operated, without regard to its conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms of Service, please contact us through the Support section in the App's Settings.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Proof, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
