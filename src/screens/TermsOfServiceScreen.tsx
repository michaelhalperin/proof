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
            By accessing or using Prooffy ("the App"), you agree to be bound by these Terms
            of Service ("Terms"). If you do not agree with these Terms, you may not use
            the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            Prooffy is an application that lets you capture trustworthy records of what
            happened and when, using notes, photos, timestamps, and cryptographic hashes.
            The App may store your data in secure cloud infrastructure and on your device
            so you can access your proofs across devices and verify shared notes and PDFs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            To use Prooffy, you must create an account with a valid email address. You are
            responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account. You agree to notify us
            promptly of any unauthorized use of your account or other security breach.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          <Text style={styles.sectionText}>
            You agree to use Prooffy only for lawful purposes and in accordance with these
            Terms. You are solely responsible for the content you create, upload, and
            store using the App. You must not:
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
            Data you create in Prooffy may be stored in secure cloud infrastructure and on
            your device. Our Privacy Policy explains in detail what we collect and how we
            use it. By using the App, you also agree to our Privacy Policy.
          </Text>
          <Text style={styles.sectionText}>
            You are responsible for:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Backing up your data</Text>
            <Text style={styles.listItem}>• Protecting your device from unauthorized access</Text>
            <Text style={styles.listItem}>• Maintaining the security of your account credentials</Text>
          </View>
          <Text style={styles.sectionText}>
            If you delete the App, lose access to your device, or fail to maintain access
            to your account, some or all of your data may become inaccessible or be
            permanently lost. We are not responsible for data loss except where required
            by applicable law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Record Integrity</Text>
          <Text style={styles.sectionText}>
            Prooffy uses cryptographic hashing and related techniques to help you verify the
            integrity of your records. While we design these features to make tampering
            detectable, we do not guarantee that records cannot be modified outside of
            the App's intended functionality. Integrity verification is provided as a
            feature, not as a legal or technical guarantee.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Immutability Policy</Text>
          <Text style={styles.sectionText}>
            Prooffy is designed so that records are not casually editable or deletable,
            which helps preserve their evidentiary value. In some cases, you may be able
            to edit or delete recent or specific records, as explained in the app.
            Immutability is a design goal, not a legal guarantee. You acknowledge that:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• You are responsible for the content of your records</Text>
            <Text style={styles.listItem}>• Device- or system-level tools may still allow data modification or removal</Text>
            <Text style={styles.listItem}>• We cannot guarantee that third parties will treat your records as immutable</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disclaimers</Text>
          <Text style={styles.sectionText}>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
            KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
            DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
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
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
            LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY
            LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
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
            You agree to indemnify and hold harmless the App developers from any claims,
            damages, losses, liabilities, and expenses (including reasonable legal fees)
            arising out of or relating to your use of the App, your violation of these
            Terms, or your infringement of any rights of another party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Modifications to Terms</Text>
          <Text style={styles.sectionText}>
            We may modify these Terms from time to time. We will notify users of any
            material changes by updating the "Last Updated" date at the top of this
            document or by providing another in-app notice. Your continued use of the App
            after such modifications constitutes acceptance of the updated Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.sectionText}>
            You may terminate your account at any time by deleting your account through
            the App's settings or by contacting us. We may suspend or terminate your
            access to the App at our sole discretion, without notice, if we believe that
            you have violated these Terms or engaged in conduct that is harmful to other
            users, us, or third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.sectionText}>
            These Terms shall be governed by and construed in accordance with the laws of
            the jurisdiction in which the App is operated or where you reside, to the
            extent permitted by law, without regard to conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms of Service, please contact us
            using the contact options available in the Contact screen within the app.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Prooffy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
