import React, { useState, useEffect, useRef, useCallback } from "react";
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
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../types/navigation";
import { getFontFamily } from "../config/theme";

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VerifyEmail"
>;
type VerifyEmailScreenRouteProp = RouteProp<RootStackParamList, "VerifyEmail">;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { verifyEmailToken, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState(route.params?.email || "");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const handleVerify = async () => {
    if (!email.trim() || !pin.trim()) {
      Alert.alert("Error", "Please enter both email and PIN code");
      return;
    }

    if (pin.trim().length !== 6 || !/^\d+$/.test(pin.trim())) {
      Alert.alert("Error", "Please enter a valid 6-digit PIN code");
      return;
    }

    setLoading(true);
    try {
      const success = await verifyEmailToken(email.trim(), pin.trim());
      if (success) {
        setVerified(true);
        Alert.alert(
          "Email Verified",
          "Your email has been verified successfully! You can now sign in.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Verification Failed",
          "Invalid or expired PIN code. Please request a new one."
        );
        setPin("");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify email");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail(email.trim());
      Alert.alert(
        "Email Sent",
        "A new verification email has been sent to your inbox."
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to resend verification email"
      );
    } finally {
      setResending(false);
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
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit PIN code sent to your email address.
          </Text>

          {verified ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                ✓ Your email has been verified successfully!
              </Text>
            </View>
          ) : (
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
                  editable={!loading && !route.params?.email}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN Code</Text>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  value={pin}
                  onChangeText={(text) => {
                    // Only allow digits and limit to 6 characters
                    const digitsOnly = text.replace(/[^0-9]/g, "").slice(0, 6);
                    setPin(digitsOnly);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  textAlign="center"
                  autoFocus
                />
                <Text style={styles.hint}>
                  Enter the 6-digit PIN code from your email
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || pin.length !== 6) && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={loading || pin.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  resending && styles.buttonDisabled,
                ]}
                onPress={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    Resend Verification Email
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

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
  hint: {
    fontSize: 12,
    fontFamily: getFontFamily("regular"),
    color: "#999",
    marginTop: 4,
  },
  pinInput: {
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: "Courier New",
    fontWeight: "600",
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
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  successContainer: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    color: "#166534",
    textAlign: "center",
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
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
