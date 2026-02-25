import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getFontFamily } from "../config/theme";
import { RootStackParamList } from "../types/navigation";
import { apiGet, apiPost } from "../utils/api";

type FeatureRequestsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FeatureRequests"
>;

export interface FeatureRequestItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  yesCount: number;
  noCount: number;
  userVote: "yes" | "no" | null;
}

interface ListResponse {
  requests: FeatureRequestItem[];
}

export default function FeatureRequestsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<FeatureRequestsScreenNavigationProp>();
  const [requests, setRequests] = useState<FeatureRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<ListResponse>("/feature-requests");
      setRequests(data.requests || []);
    } catch (e: any) {
      console.error("Failed to load feature requests:", e);
      if (e?.status === 401) return;
      Alert.alert(
        "Error",
        "Could not load feature requests. Pull to refresh or try again later.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleVote = async (id: string, vote: "yes" | "no") => {
    if (votingId) return;
    setVotingId(id);
    try {
      const result = await apiPost<{
        id: string;
        yesCount: number;
        noCount: number;
        userVote: "yes" | "no" | null;
      }>(`/feature-requests/${id}/vote`, { vote });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                yesCount: result.yesCount,
                noCount: result.noCount,
                userVote: result.userVote,
              }
            : r,
        ),
      );
    } catch (e: any) {
      if (e?.status !== 401) {
        Alert.alert("Error", "Could not save your vote. Try again.");
      }
    } finally {
      setVotingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Feature Requests</Text>
        <Text style={styles.subtitle}>
          See what others are asking for. Tap Yes or No to show your support.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loaderText}>Loading…</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={56} color="#ccc" />
          <Text style={styles.emptyTitle}>No feature requests yet</Text>
          <Text style={styles.emptyText}>
            Submit a feature idea from Feedback & Feature Bounty to see it here.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Feedback")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Feedback</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {requests.map((r) => {
            const isVoting = votingId === r.id;
            return (
              <View key={r.id} style={styles.card}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                {r.body ? (
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {r.body}
                  </Text>
                ) : null}
                <Text style={styles.cardDate}>{formatDate(r.createdAt)}</Text>

                {isVoting && (
                  <View style={styles.votingIndicator}>
                    <ActivityIndicator size="small" color="#666" />
                  </View>
                )}
                <View style={styles.voteRow}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      r.userVote === "yes" && styles.voteButtonYesActive,
                    ]}
                    onPress={() => handleVote(r.id, "yes")}
                    disabled={isVoting}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="thumbs-up"
                      size={18}
                      color={r.userVote === "yes" ? "#fff" : "#666"}
                    />
                    <Text
                      style={[
                        styles.voteButtonText,
                        r.userVote === "yes" && styles.voteButtonTextActive,
                      ]}
                    >
                      Yes
                    </Text>
                    <Text
                      style={[
                        styles.voteCount,
                        r.userVote === "yes" && styles.voteCountActive,
                      ]}
                    >
                      {r.yesCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      r.userVote === "no" && styles.voteButtonNoActive,
                    ]}
                    onPress={() => handleVote(r.id, "no")}
                    disabled={isVoting}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="thumbs-down"
                      size={18}
                      color={r.userVote === "no" ? "#fff" : "#666"}
                    />
                    <Text
                      style={[
                        styles.voteButtonText,
                        r.userVote === "no" && styles.voteButtonTextActive,
                      ]}
                    >
                      No
                    </Text>
                    <Text
                      style={[
                        styles.voteCount,
                        r.userVote === "no" && styles.voteCountActive,
                      ]}
                    >
                      {r.noCount}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Feedback")}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color="#000" />
          <Text style={styles.secondaryButtonText}>Suggest a feature</Text>
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    lineHeight: 22,
  },
  loaderWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    fontFamily: getFontFamily("regular"),
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    fontFamily: getFontFamily("regular"),
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#fff",
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  cardDate: {
    fontSize: 12,
    color: "#999",
    fontFamily: getFontFamily("regular"),
    marginBottom: 14,
  },
  votingIndicator: {
    alignSelf: "center",
    marginBottom: 8,
  },
  voteRow: {
    flexDirection: "row",
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 6,
  },
  voteButtonYesActive: {
    backgroundColor: "#1a7f37",
    borderColor: "#1a7f37",
  },
  voteButtonNoActive: {
    backgroundColor: "#666",
    borderColor: "#666",
  },
  voteButtonText: {
    fontSize: 14,
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
  },
  voteButtonTextActive: {
    color: "#fff",
  },
  voteCount: {
    fontSize: 13,
    fontFamily: getFontFamily("medium"),
    color: "#999",
  },
  voteCountActive: {
    color: "rgba(255,255,255,0.9)",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
  },
});
