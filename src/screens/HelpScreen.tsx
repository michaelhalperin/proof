import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Proof?',
    answer:
      'Proof is an offline-first daily evidence log app that lets you create tamper-evident records with notes and photos. All data is stored locally on your device - nothing is sent to the cloud.',
  },
  {
    question: 'How does tamper-evidence work?',
    answer:
      'Each proof record includes a SHA-256 cryptographic hash that verifies the integrity of your data. If any part of a record is modified, the hash will change and the integrity check will fail, alerting you to any tampering.',
  },
  {
    question: 'Can I edit or delete past records?',
    answer:
      'Once saved, proof records are immutable (cannot be edited or deleted) to ensure evidence integrity. However, you can edit or delete today\'s record before the day ends. This protects the authenticity of your evidence log.',
  },
  {
    question: 'How do I export my proof records?',
    answer:
      'You can export any proof record as a PDF by opening the record detail screen and tapping the "Export PDF" button. The PDF includes all photos, notes, timestamps, and the integrity hash. You can also share individual photos or notes using the share button.',
  },
  {
    question: 'Is my data backed up?',
    answer:
      'All data is stored locally on your device. We recommend regularly exporting important records as PDFs and storing them in a safe location. The app includes an "Export All Data" feature in Settings for backing up all your records.',
  },
  {
    question: 'How do I use tags?',
    answer:
      'When creating a proof record, you can add tags to categorize your entries. Select from common tags or create custom tags. Tags help you organize and search through your records.',
  },
  {
    question: 'What happens if I lose my device?',
    answer:
      'Since all data is stored locally, if you lose your device without backups, the data cannot be recovered. We strongly recommend using the "Export All Data" feature regularly to back up your records to a secure location.',
  },
  {
    question: 'Can I add location to my records?',
    answer:
      'Yes! When creating a proof record, you can optionally add your current location. The app will use GPS to capture your location and display it on the record. You can toggle location on or off for each record.',
  },
  {
    question: 'How do reminders work?',
    answer:
      'You can set up daily reminders in Settings to help you remember to log your daily proof. Set your preferred reminder time, and the app will send you a notification each day at that time.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes! Proof is completely offline and privacy-first. Your data never leaves your device. There are no cloud services, no analytics, no tracking, and no data transmission. Your privacy is guaranteed.',
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
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(
    new Set()
  );

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
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
                name={expandedItems.has(index) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedItems.has(index) && (
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
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
});

