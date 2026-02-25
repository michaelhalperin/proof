import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { getFontFamily } from "../config/theme";
import { API_URL } from "../config/env";
import {
  parseSharedNoteText,
  parseProofPdfText,
  parsePhotoHashesInput,
  verifyProof,
} from "../utils/verifyProof";

type Tab = "paste" | "pdf" | "manual";

export default function VerifyProofScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("paste");

  const [pastedText, setPastedText] = useState("");
  const [manualHash, setManualHash] = useState("");
  const [manualDateKey, setManualDateKey] = useState("");
  const [manualTimestamp, setManualTimestamp] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualPhotoHashes, setManualPhotoHashes] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    computedHash?: string;
    error?: string;
  } | null>(null);

  const handlePickPdf = async () => {
    setResult(null);
    try {
      const pickResult = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (pickResult.canceled) return;
      const file = pickResult.assets[0];
      setPdfFileName(file.name);
      setPdfExtracting(true);
      let extractedText: string | null = null;
      try {
        const formData = new FormData();
        // On React Native, file objects need uri, name, and type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formData.append("file", {
          uri: file.uri,
          name: file.name || "proof.pdf",
          type: "application/pdf",
        } as any);

        const response = await fetch(`${API_URL}/verify/pdf`, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => null);
          const message =
            errorJson?.error ||
            "Could not read PDF. Try again or use Enter details.";
          throw new Error(message);
        }

        const json = (await response.json()) as { text?: string };
        extractedText = json.text ?? null;
      } catch (err) {
        setPdfExtracting(false);
        setResult({
          valid: false,
          error:
            err instanceof Error
              ? err.message
              : "Could not read PDF. Use Enter details and copy Hash, Date, Timestamp from the file.",
        });
        return;
      }
      setPdfExtracting(false);
      if (!extractedText?.trim()) {
        setResult({
          valid: false,
          error:
            "Could not read PDF. Use Enter details and copy Hash, Date, Timestamp from the file.",
        });
        return;
      }
      const parsed = parseProofPdfText(extractedText);
      if (!parsed) {
        setResult({
          valid: false,
          error: "No proof data found. Use a PDF exported from Prooffy.",
        });
        return;
      }
      setVerifying(true);
      try {
        const notesToTry = [
          parsed.note,
          ...(parsed.noteCandidates || []).filter((n) => n !== parsed.note),
        ];
        let lastResult: { valid: boolean; computedHash?: string } = {
          valid: false,
          computedHash: undefined,
        };
        for (const note of notesToTry) {
          const result = await verifyProof(
            parsed.dateKey,
            parsed.createdAt,
            note,
            parsed.photos,
            parsed.hash,
          );
          lastResult = result;
          if (result.valid) break;
        }
        setResult(lastResult);
      } catch (e) {
        setResult({
          valid: false,
          error: e instanceof Error ? e.message : "Verification failed.",
        });
      } finally {
        setVerifying(false);
      }
    } catch (e) {
      setPdfExtracting(false);
      setResult({
        valid: false,
        error: e instanceof Error ? e.message : "Failed to open PDF.",
      });
    }
  };

  const handleVerifyPaste = async () => {
    setResult(null);
    const parsed = parseSharedNoteText(pastedText);
    if (!parsed) {
      const looksLikeNoteOnly =
        pastedText.trim().length > 0 &&
        !pastedText.includes("Hash:") &&
        !pastedText.includes("Prooffy") &&
        !/\d{4}-\d{2}-\d{2}\s+\d{10,15}\s+[a-fA-F0-9]{64}/.test(pastedText);
      setResult({
        valid: false,
        error: looksLikeNoteOnly
          ? "Verification data is missing — many apps remove it when sharing. Paste the full message (note + the line under it) or use Enter details with the hash from the original."
          : "Could not parse. Paste the full shared message (including the verification line) or use Enter details.",
      });
      return;
    }
    setVerifying(true);
    try {
      const { valid, computedHash } = await verifyProof(
        parsed.dateKey,
        parsed.createdAt,
        parsed.note,
        parsed.photos,
        parsed.hash,
      );
      setResult({ valid, computedHash });
    } catch (e) {
      setResult({
        valid: false,
        error: e instanceof Error ? e.message : "Verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyManual = async () => {
    setResult(null);
    const hash = manualHash.trim();
    if (!hash || hash.length !== 64 || !/^[a-fA-F0-9]+$/.test(hash)) {
      setResult({
        valid: false,
        error: "Hash must be 64 hex characters.",
      });
      return;
    }
    const dateKey = manualDateKey.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setResult({
        valid: false,
        error: "Date must be YYYY-MM-DD.",
      });
      return;
    }
    const ts = manualTimestamp.trim();
    const createdAt = ts
      ? parseInt(ts, 10)
      : Date.UTC(
          parseInt(dateKey.slice(0, 4), 10),
          parseInt(dateKey.slice(5, 7), 10) - 1,
          parseInt(dateKey.slice(8, 10), 10),
        );
    if (Number.isNaN(createdAt)) {
      setResult({
        valid: false,
        error: "Timestamp must be a number.",
      });
      return;
    }
    const photos = parsePhotoHashesInput(manualPhotoHashes);
    setVerifying(true);
    try {
      const { valid, computedHash } = await verifyProof(
        dateKey,
        createdAt,
        manualNote.trim(),
        photos,
        hash,
      );
      setResult({ valid, computedHash });
    } catch (e) {
      setResult({
        valid: false,
        error: e instanceof Error ? e.message : "Verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top - 25 }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.keyboardDismissWrap}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboard}
          >
            <View style={styles.header}>
              <Text style={styles.subtitle}>
                Paste, upload, or enter details to check if a proof is
                legitimate.
              </Text>
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, tab === "paste" && styles.tabActive]}
                onPress={() => {
                  setTab("paste");
                  setResult(null);
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={tab === "paste" ? "#000" : "#666"}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "paste" && styles.tabLabelActive,
                  ]}
                >
                  Paste text
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === "pdf" && styles.tabActive]}
                onPress={() => {
                  setTab("pdf");
                  setResult(null);
                }}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={18}
                  color={tab === "pdf" ? "#000" : "#666"}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "pdf" && styles.tabLabelActive,
                  ]}
                >
                  Upload PDF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === "manual" && styles.tabActive]}
                onPress={() => {
                  setTab("manual");
                  setResult(null);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={tab === "manual" ? "#000" : "#666"}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    tab === "manual" && styles.tabLabelActive,
                  ]}
                >
                  Enter details
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {tab === "paste" ? (
                <View style={styles.section}>
                  <Text style={styles.label}>Paste shared message</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Paste the full proof text here…"
                    placeholderTextColor="#999"
                    multiline
                    value={pastedText}
                    onChangeText={setPastedText}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerifyPaste}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : tab === "pdf" ? (
                <View style={styles.section}>
                  <Text style={styles.label}>Prooffy PDF</Text>
                  {pdfFileName && (
                    <Text style={styles.pdfFileName} numberOfLines={1}>
                      {pdfFileName}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handlePickPdf}
                    disabled={pdfExtracting || verifying}
                  >
                    {pdfExtracting || verifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.buttonRow}>
                        <Ionicons
                          name="document-attach-outline"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.buttonText}>
                          {pdfFileName ? "Choose another" : "Choose PDF"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.section}>
                  <Text style={styles.label}>Hash *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="64 hex characters"
                    placeholderTextColor="#999"
                    value={manualHash}
                    onChangeText={setManualHash}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.label}>Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                    value={manualDateKey}
                    onChangeText={setManualDateKey}
                  />
                  <Text style={styles.label}>Timestamp</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ms (from PDF or message)"
                    placeholderTextColor="#999"
                    value={manualTimestamp}
                    onChangeText={setManualTimestamp}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.label}>Note</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Note text if the proof had one"
                    placeholderTextColor="#999"
                    multiline
                    value={manualNote}
                    onChangeText={setManualNote}
                    textAlignVertical="top"
                  />
                  <Text style={styles.label}>Photo hashes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="One 64-char hash per line (optional)"
                    placeholderTextColor="#999"
                    multiline
                    value={manualPhotoHashes}
                    onChangeText={setManualPhotoHashes}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerifyManual}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {result && (
                <View
                  style={[
                    styles.resultBox,
                    result.valid ? styles.resultValid : styles.resultInvalid,
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Ionicons
                      name={result.valid ? "shield-checkmark" : "warning"}
                      size={28}
                      color={result.valid ? "#1a7f37" : "#c92a2a"}
                    />
                    <Text
                      style={[
                        styles.resultTitle,
                        result.valid
                          ? styles.resultTitleValid
                          : styles.resultTitleInvalid,
                      ]}
                    >
                      {result.valid ? "Legitimate" : "Fabricated or altered"}
                    </Text>
                  </View>
                  {result.error && (
                    <Text style={styles.resultError}>{result.error}</Text>
                  )}
                  {result.valid && (
                    <Text style={styles.resultDetail}>
                      Hash matches — proof is unaltered.
                    </Text>
                  )}
                  {/* {!result.valid && result.computedHash && (
                <Text style={[styles.resultDetail, styles.resultHint]}>
                  Re-share from the app (Edit → Save, then Share) so the new message verifies.
                </Text>
              )} */}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardDismissWrap: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 22,
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    lineHeight: 18,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  tabActive: {
    backgroundColor: "#e8e8e8",
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#666",
  },
  tabLabelActive: {
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: getFontFamily("semiBold"),
    color: "#555",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    color: "#000",
    marginBottom: 14,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: getFontFamily("semiBold"),
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfFileName: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    marginBottom: 12,
  },
  resultBox: {
    marginTop: 4,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultValid: {
    backgroundColor: "#f0f9f4",
    borderColor: "#1a7f37",
  },
  resultInvalid: {
    backgroundColor: "#fff5f5",
    borderColor: "#c92a2a",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 17,
    fontFamily: getFontFamily("bold"),
  },
  resultTitleValid: {
    color: "#1a7f37",
  },
  resultTitleInvalid: {
    color: "#c92a2a",
  },
  resultError: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#c92a2a",
    marginTop: 4,
  },
  resultDetail: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#555",
    marginTop: 4,
  },
  resultHint: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
  },
});
