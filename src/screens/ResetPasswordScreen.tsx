import React, { useState, useRef, useCallback, useEffect } from "react";
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

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ResetPassword"
>;
type ResetPasswordScreenRouteProp = RouteProp<
  RootStackParamList,
  "ResetPassword"
>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { resetPassword, verifyPasswordResetPin } = useAuth();
  const [email, setEmail] = useState(route.params?.email || "");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"pin" | "password">("pin");
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset loading state when step changes to password
  useEffect(() => {
    if (step === "password") {
      // Ensure loading is false when entering password step
      setLoading(false);
      // Clear password fields when entering password step
      setPassword("");
      setConfirmPassword("");
    }
  }, [step]);

  // Scroll to top when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      // Reset loading when screen comes into focus
      setLoading(false);
    }, [])
  );

  const handlePinVerify = async () => {
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
      const isValid = await verifyPasswordResetPin(email.trim(), pin.trim());
      if (isValid) {
        // PIN is valid, proceed to password step
        setLoading(false); // Reset loading before changing step
        setStep("password");
      } else {
        Alert.alert(
          "Invalid PIN",
          "The PIN code is invalid or has expired. Please request a new password reset."
        );
        setPin("");
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify PIN code");
      setPin("");
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const success = await resetPassword(email.trim(), pin.trim(), password);
      if (success) {
        Alert.alert(
          "Password Reset",
          "Your password has been reset successfully! You can now sign in with your new password.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Reset Failed",
          "Invalid or expired PIN code. Please request a new password reset."
        );
        setStep("pin");
        setPin("");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reset password");
      setStep("pin");
      setPin("");
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === "pin"
              ? "Enter the PIN code sent to your email"
              : "Enter your new password below"}
          </Text>

          <View style={styles.form}>
            {step === "pin" ? (
              <>
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
                      const digitsOnly = text
                        .replace(/[^0-9]/g, "")
                        .slice(0, 6);
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
                    (loading || pin.length !== 6 || !email.trim()) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handlePinVerify}
                  disabled={loading || pin.length !== 6 || !email.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify PIN</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    key="new-password-input"
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    selectTextOnFocus={false}
                  />
                  <Text style={styles.hint}>At least 6 characters</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    key="confirm-password-input"
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    selectTextOnFocus={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleReset}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
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
    letterSpacing: 0,
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
