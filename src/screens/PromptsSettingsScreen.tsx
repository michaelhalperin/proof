import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getPrompts,
  savePrompts,
  addPrompt,
  deletePrompt,
  arePromptsEnabled,
  setPromptsEnabled,
  JournalPrompt,
} from "../utils/prompts";
import { getFontFamily } from "../config/theme";

export default function PromptsSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newPromptText, setNewPromptText] = useState("");
  const [saving, setSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [promptsData, enabledStatus] = await Promise.all([
        getPrompts(),
        arePromptsEnabled(),
      ]);
      setPrompts(promptsData);
      setEnabled(enabledStatus);
    } catch (error) {
      console.error("Error loading prompts settings:", error);
      Alert.alert("Error", "Failed to load prompts settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const newValue = !enabled;
      await setPromptsEnabled(newValue);
      setEnabled(newValue);
    } catch (error) {
      console.error("Error toggling prompts:", error);
      Alert.alert("Error", "Failed to update setting.");
    }
  };

  const handleAddPrompt = async () => {
    if (!newPromptText.trim()) {
      Alert.alert("Error", "Please enter a prompt text.");
      return;
    }

    try {
      setSaving(true);
      const newPrompt = await addPrompt(newPromptText.trim());
      setPrompts([...prompts, newPrompt]);
      setNewPromptText("");
    } catch (error) {
      console.error("Error adding prompt:", error);
      Alert.alert("Error", "Failed to add prompt.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    // Don't allow deleting default prompts
    if (id.startsWith("default-")) {
      Alert.alert("Cannot Delete", "Default prompts cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete Prompt",
      "Are you sure you want to delete this prompt?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePrompt(id);
              setPrompts(prompts.filter((p) => p.id !== id));
            } catch (error) {
              console.error("Error deleting prompt:", error);
              Alert.alert("Error", "Failed to delete prompt.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Journal Prompts</Text>
          <Text style={styles.subtitle}>
            Customize prompts that appear when creating new proof records
          </Text>
        </View>

        {/* Enable/Disable Toggle */}
        <View style={styles.section}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleToggleEnabled}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="bulb-outline"
                    size={20}
                    color="#000"
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Enable Prompts</Text>
                  <Text style={styles.settingValue}>
                    {enabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
              <View style={enabled ? styles.toggleOn : styles.toggleOff}>
                <View
                  style={
                    enabled ? styles.toggleThumbOn : styles.toggleThumbOff
                  }
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add New Prompt */}
        {enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Custom Prompt</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.promptInput}
                placeholder="Enter a new prompt question..."
                placeholderTextColor="#999"
                value={newPromptText}
                onChangeText={setNewPromptText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!newPromptText.trim() || saving) && styles.addButtonDisabled,
                ]}
                onPress={handleAddPrompt}
                disabled={!newPromptText.trim() || saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Add Prompt</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Prompts List */}
        {enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Prompts ({prompts.length})
            </Text>
            <View style={styles.card}>
              {prompts.map((prompt, index) => (
                <View key={prompt.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.promptItem}>
                    <View style={styles.promptItemContent}>
                      <Text style={styles.promptItemText}>{prompt.text}</Text>
                      {prompt.id.startsWith("default-") && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    {!prompt.id.startsWith("default-") && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePrompt(prompt.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {!enabled && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.infoText}>
              Prompts are disabled. Enable them to see reflection questions when creating new proof records.
            </Text>
          </View>
        )}
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
    marginBottom: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    fontFamily: getFontFamily("regular"),
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
    color: "#000",
  },
  settingValue: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    marginTop: 2,
  },
  toggleOn: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#34C759",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleOff: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ccc",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumbOn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  toggleThumbOff: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: getFontFamily("regular"),
    minHeight: 80,
    backgroundColor: "#fafafa",
    marginBottom: 12,
    textAlignVertical: "top",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  promptItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  promptItemContent: {
    flex: 1,
    marginRight: 12,
  },
  promptItemText: {
    fontSize: 15,
    fontFamily: getFontFamily("regular"),
    color: "#000",
    lineHeight: 22,
    marginBottom: 4,
  },
  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontFamily: getFontFamily("medium"),
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginLeft: 52,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    fontFamily: getFontFamily("regular"),
    lineHeight: 20,
  },
});
