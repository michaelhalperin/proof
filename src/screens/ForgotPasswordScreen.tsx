import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../types/navigation";
import { getFontFamily } from "../config/theme";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const handleResetRequest = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setEmailSent(true);
      Alert.alert(
        "Email Sent",
        "If an account exists with this email, you will receive a password reset PIN code shortly. Enter it below to reset your password.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to ResetPassword screen with email pre-filled
              navigation.navigate("ResetPassword", { email: email.trim() });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to send password reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a PIN code to reset your
            password.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset PIN</Text>
              )}
            </TouchableOpacity>

            {emailSent && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Check your email for the password reset PIN code. The PIN will
                  expire in 10 minutes.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Back to <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    color: "#000",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  successContainer: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    color: "#0369a1",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: getFontFamily("regular"),
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
  },
  linkTextBold: {
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
  },
});
