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
          <Ionicons name="shield-checkmark" size={48} color="#000" style={styles.headerIcon} />
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            At Prooffy, we are committed to protecting your privacy and giving you clear,
            understandable information about how your data is handled. This Privacy Policy
            explains what we collect, how we use it, and the choices you have when using
            the Prooffy app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            Prooffy collects only the data needed to provide the service and let you
            capture and verify your records.
          </Text>
          <Text style={styles.sectionText}>
            This includes:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Account information</Text> – the email
              address and name you provide when you create an account.
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Prooffy records</Text> – notes, timestamps,
              cryptographic hashes, and other metadata required to create and verify your
              proofs. Photos you attach to a proof may be stored on your device and/or
              in secure storage depending on how you use the app.
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Technical information</Text> – limited
              diagnostic and analytics information (such as crash logs or basic usage
              data) to keep Prooffy reliable and secure.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
          <Text style={styles.sectionText}>
            We use the information described above only to:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Provide core Prooffy functionality and keep your records available to you</Text>
            <Text style={styles.listItem}>• Help you create, export, and verify proofs</Text>
            <Text style={styles.listItem}>• Maintain and improve the reliability, performance, and security of the app</Text>
            <Text style={styles.listItem}>• Send essential account-related emails such as verification and password reset messages</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Storage</Text>
          <Text style={styles.sectionText}>
            Prooffy stores your data using a combination of secure cloud infrastructure and
            local storage on your device.
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Cloud storage</Text> for your account,
              proof records, and related metadata so you can sign in on a new device and
              access your existing proofs.
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Local storage</Text> on your device for
              things like cached content and photo files, depending on your settings and
              how you use the app.
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.bold}>Secure storage</Text> (such as encrypted
              keychain/secure storage) for authentication tokens and other sensitive data.
            </Text>
          </View>
          <Text style={styles.sectionText}>
            We do not sell your data. We use industry-standard security practices to help
            protect the information we store.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
          <Text style={styles.sectionText}>
            We rely on carefully selected third-party providers to help us operate the
            app. These providers may process limited personal data on our behalf. This
            may include:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Email delivery services for account verification and password reset emails</Text>
            <Text style={styles.listItem}>• Hosting and database providers for secure storage of your account and proof data</Text>
            <Text style={styles.listItem}>• Analytics or crash-reporting tools to help us diagnose issues and improve the app</Text>
          </View>
          <Text style={styles.sectionText}>
            These providers are only allowed to use your data to perform services for
            Prooffy and must protect it appropriately. We do not allow third parties to
            use your personal data for their own marketing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Permissions</Text>
          <Text style={styles.sectionText}>
            Prooffy may request the following device permissions:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Camera – to take photos for proof records (optional)</Text>
            <Text style={styles.listItem}>• Photo Library – to select existing photos for proof records (optional)</Text>
            <Text style={styles.listItem}>• Location – to optionally tag records with location data (optional)</Text>
            <Text style={styles.listItem}>• Notifications – to send reminders about logging proofs (optional)</Text>
          </View>
          <Text style={styles.sectionText}>
            You can manage or revoke these permissions at any time in your device
            settings. Some features may not work without the relevant permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Security</Text>
          <Text style={styles.sectionText}>
            We take reasonable measures to protect your data against accidental or
            unlawful destruction, loss, alteration, and unauthorized access or
            disclosure. These measures include:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Encrypting sensitive data in transit and at rest where appropriate</Text>
            <Text style={styles.listItem}>• Using secure authentication and access controls</Text>
            <Text style={styles.listItem}>• Applying security updates and monitoring for potential issues</Text>
          </View>
          <Text style={styles.sectionText}>
            No method of transmission or storage is completely secure. You are also
            responsible for keeping your device and account credentials safe.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Your Choices and Rights</Text>
          <Text style={styles.sectionText}>
            Depending on your location, you may have certain rights over your personal
            data, such as the right to access, correct, or delete it.
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• You can view and manage your proofs from within the app.</Text>
            <Text style={styles.listItem}>• You can delete individual proofs from inside the app.</Text>
            <Text style={styles.listItem}>
              • You can request account and data deletion using the contact options
              available in the Contact screen of the app.
            </Text>
          </View>
          <Text style={styles.sectionText}>
            We may need to retain certain information where required by law or for
            legitimate business purposes (for example, to prevent abuse or resolve
            disputes).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Prooffy is not intended for children under the age of 13. We do not knowingly
            collect personal information from children under 13. If you believe that a
            child has provided us with personal information, please contact us and we
            will take appropriate steps to address the issue.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last Updated" date at the top of this document. Your continued use of the App after such modifications constitutes acceptance of the updated Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy or how Prooffy handles your
            data, please reach out using the contact options provided in the Contact
            screen within the app.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is fundamental to Prooffy. We collect only what we need to run the
            service and help you capture and verify trustworthy records.
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
