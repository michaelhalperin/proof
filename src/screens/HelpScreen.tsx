import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getFontFamily } from '../config/theme';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Proof?',
    answer:
      'Proof lets you capture trustworthy records of what happened and when, using notes, photos, timestamps, and cryptographic fingerprints that can be verified later. Your proof records are stored securely in the cloud and tied to your account, so you can sign in on a new device and access your existing proofs.',
  },
  {
    question: 'How does tamper-evidence work?',
    answer:
      'Each proof record includes integrity data (such as a SHA-256 cryptographic hash) that verifies the integrity of your data. When you share a proof as text or PDF, the app includes everything needed to recompute and check this hash. If any part of the content is modified, the hash will no longer match and the verification check will fail.',
  },
  {
    question: 'Can I edit or delete past records?',
    answer:
      'Proof is designed so that records are not casually editable or deletable, which helps preserve their evidentiary value. In most cases, you can only edit or delete today\'s record from within the app; older records are treated as immutable. Device- or system-level tools may still remove data, and we can\'t guarantee that third parties will always treat your records as immutable.',
  },
  {
    question: 'How do I export my proof records?',
    answer:
      'You can export any proof record as a PDF by opening the record detail screen and tapping the "Export PDF" button. The PDF includes your notes, timestamps, integrity data, and any photos that are available. You can also share a proof as text for quick messaging, or use the Verify tab to check shared notes and PDFs that were created in Proof.',
  },
  {
    question: 'Is my data backed up?',
    answer:
      'Your proof records are stored in the Proof backend and linked to your account, so you can sign in on a new device and access your existing proofs. For extra safety, you can also use the "Export All Data" option in Settings to generate a PDF containing all of your records and store it in a secure location you control.',
  },
  {
    question: 'How do I use tags?',
    answer:
      'When creating a proof record, you can add tags to categorize your entries. Select from common tags or create custom tags. Tags help you organize and search through your records.',
  },
  {
    question: 'What happens if I lose my device?',
    answer:
      'Because your records are tied to your Proof account, you can install the app on a new device, sign in, and access your existing proofs. Local copies of some photos on a specific device may not be available if those image files were removed from that device, so it\'s still a good idea to keep your own backups of especially important exports.',
  },
  {
    question: 'Can I add location to my records?',
    answer:
      'Yes! When creating a proof record, you can optionally add your current location. The app will use GPS to capture your location and display it on the record. You can toggle location on or off for each record.',
  },
  {
    question: 'How do reminders work?',
    answer:
      'You can set up daily reminders in Settings to help you remember to log your daily proof. Set your preferred reminder time, and the app will schedule a notification around that time. If you\'ve already created a proof for today, the reminder will typically be skipped so you are not notified unnecessarily.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. Proof is designed so that you stay in control of your data. Your records are stored securely and transmitted over encrypted connections, and we don\'t sell your personal data. We may use limited diagnostics and analytics (such as crash reports) and trusted third-party providers to operate the service, as explained in the Privacy Policy, but your proof content is not used for advertising or profiling.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings → Account → Change Password. Enter your current password and your new password. Make sure your new password is at least 6 characters long.',
  },
  {
    question: 'What if I forget my password?',
    answer:
      'On the login screen, tap "Forgot Password?" and enter your email address. You\'ll receive a 6-digit PIN code to reset your password. Enter the PIN and set a new password.',
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const toggleItem = (index: number) => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Ionicons name="help-circle" size={48} color="#000" />
        <Text style={styles.title}>Help & FAQ</Text>
        <Text style={styles.subtitle}>
          Find answers to common questions about Proof
        </Text>
      </View>

      <View style={styles.faqSection}>
        {FAQ_DATA.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleItem(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQuestionText}>{item.question}</Text>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Still have questions? The app is designed to be simple and intuitive.
          Explore the features and discover how Proof can help you maintain your
          daily evidence log.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: getFontFamily('bold'),
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: getFontFamily('regular'),
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  faqSection: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: getFontFamily('semiBold'),
    color: '#000',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  faqAnswerText: {
    fontSize: 15,
    fontFamily: getFontFamily('regular'),
    color: '#666',
    lineHeight: 22,
    marginTop: 16,
  },
  footer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 15,
    fontFamily: getFontFamily('regular'),
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
});

