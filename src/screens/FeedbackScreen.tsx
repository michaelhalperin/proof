import React, { useState, useCallback, useRef } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";
import { useAuth } from "../context/AuthContext";
import { sendSupportEmail } from "../utils/emailService";
import { apiPost } from "../utils/api";
import { RootStackParamList } from "../types/navigation";

type FeedbackType = "feedback" | "bug" | "feature";

const FEEDBACK_TYPE_OPTIONS: {
  value: FeedbackType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "feedback",
    label: "General Feedback",
    icon: "chatbubble-ellipses-outline",
  },
  { value: "bug", label: "Bug Report", icon: "bug-outline" },
  { value: "feature", label: "Feature Request", icon: "sparkles-outline" },
];

type FeedbackScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Feedback"
>;

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const buildSubject = () => {
    const prefix =
      type === "bug"
        ? "[Bug]"
        : type === "feature"
          ? "[Feature Request]"
          : "[Feedback]";
    const trimmed = subject.trim();
    return trimmed ? `${prefix} ${trimmed}` : prefix;
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      Alert.alert(
        "Message Required",
        "Please describe your feedback, bug, or feature idea.",
      );
      return;
    }

    try {
      setSending(true);
      const fullSubject = buildSubject();
      const fullMessage = `Type: ${FEEDBACK_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}\n\n${trimmedMessage}`;

      let featureRequestAdded = false;
      if (type === "feature") {
        const title =
          subject.trim() || trimmedMessage.slice(0, 80).replace(/\n/g, " ");
        try {
          await apiPost("/feature-requests", {
            title: title.slice(0, 200),
            body: trimmedMessage.slice(0, 2000),
          });
          featureRequestAdded = true;
        } catch (e) {
          console.warn("Feature request not added to list (API failed):", e);
        }
      }

      await sendSupportEmail(fullSubject, fullMessage, user?.email);

      if (type === "feature" && featureRequestAdded) {
        setSubject("");
        setMessage("");
        Alert.alert(
          "Thank You",
          "Your feature request was added to the community list. Others can vote on it.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("FeatureRequests"),
            },
          ],
        );
      } else if (type === "feature" && !featureRequestAdded) {
        setSubject("");
        setMessage("");
        Alert.alert(
          "Message Sent",
          "Your request was sent by email. It couldn't be added to the community list right now (check that the app is connected to the server). You can still open \"See others' feature requests\" to view and vote on existing ones.",
        );
      } else {
        Alert.alert(
          "Thank You",
          "Your message has been sent. We read every submission and use it to improve Prooffy.",
        );
        setSubject("");
        setMessage("");
      }
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      const errorMessage = error?.message || "";
      if (
        errorMessage.includes("only send testing emails") ||
        errorMessage.includes("verify a domain")
      ) {
        Alert.alert(
          "Email Limitation",
          "Your message was sent to your email instead. To send directly to the team, verify the support email configuration.",
        );
      } else {
        Alert.alert(
          "Error",
          errorMessage ||
            "Failed to send. Please try again or use Contact & Support.",
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
      ref={scrollViewRef}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Ionicons name="megaphone-outline" size={48} color="#000" />
        <Text style={styles.title}>Feedback & Feature Bounty</Text>
        <Text style={styles.subtitle}>
          Share feedback, report bugs, or request features in one place.
        </Text>
      </View>

      {/* Community feature requests */}
      <TouchableOpacity
        style={styles.communityCard}
        onPress={() => navigation.navigate("FeatureRequests")}
        activeOpacity={0.7}
      >
        <View style={styles.communityIconWrap}>
          <Ionicons name="people-outline" size={24} color="#1a7f37" />
        </View>
        <View style={styles.communityContent}>
          <Text style={styles.communityTitle}>
            See others’ feature requests
          </Text>
          <Text style={styles.communityText}>
            Browse what others are asking for and tap Yes or No to show your
            support.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#999" />
      </TouchableOpacity>

      {/* Type selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What are you sending?</Text>
        <View style={styles.typeRow}>
          {FEEDBACK_TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.typeChip,
                type === opt.value && styles.typeChipActive,
              ]}
              onPress={() => setType(opt.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={18}
                color={type === opt.value ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.typeChipText,
                  type === opt.value && styles.typeChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Form card */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="create-outline" size={24} color="#000" />
            <Text style={styles.cardTitle}>
              {type === "feature"
                ? "Feature idea"
                : type === "bug"
                  ? "Bug details"
                  : "Your message"}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {type === "feature"
                ? "Feature title (optional)"
                : "Subject (optional)"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                type === "feature"
                  ? "e.g. Dark mode, Widget for home screen"
                  : "Short summary"
              }
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
              maxLength={120}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={
                type === "feature"
                  ? "Describe the feature and why it would help..."
                  : type === "bug"
                    ? "Steps to reproduce, what you expected, what happened..."
                    : "Your feedback..."
              }
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{message.length}/2000</Text>
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
              onPress={handleSend}
              activeOpacity={0.7}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.sendButtonText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Feature Bounty info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.bountyIconWrap}>
            <Ionicons name="trophy-outline" size={28} color="#1a7f37" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Feature Bounty</Text>
            <Text style={styles.infoText}>
              Suggest features you'd love to see. We use votes to see what helps
              the most people and guide future updates.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Response</Text>
            <Text style={styles.infoText}>
              We read every submission. For a direct reply, use Contact &
              Support in Settings.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for helping shape Prooffy. Your input makes the app better
          for everyone.
        </Text>
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
    marginBottom: 28,
    paddingVertical: 12,
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
  communityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  communityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  communityContent: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 2,
  },
  communityText: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  typeChipText: {
    fontSize: 14,
    fontFamily: getFontFamily("medium"),
    color: "#666",
  },
  typeChipTextActive: {
    color: "#fff",
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginLeft: 12,
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
    borderRadius: 10,
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
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  bountyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
    marginTop: 8,
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
