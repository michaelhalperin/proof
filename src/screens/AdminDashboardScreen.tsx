import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import {
  getDatabaseInfo,
  getAllRecordsWithDetails,
  getAllUsers,
  executeQuery,
  getTableSchema,
  DatabaseInfo,
  RecordDetail,
} from "../utils/adminUtils";
import { User } from "../db/auth";
import { useAuth } from "../context/AuthContext";
import { formatDateKey, formatTimestamp } from "../utils/dateUtils";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { sharePDF } from "../utils/shareUtils";

const ADMIN_USER_ID = "4051afae-cd51-4518-b5e6-d1463453743b";

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AdminDashboard"
>;

type TabType = "overview" | "records" | "users" | "query";

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [records, setRecords] = useState<RecordDetail[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [queryText, setQueryText] = useState<string>(
    "SELECT * FROM records LIMIT 10"
  );
  const [queryResults, setQueryResults] = useState<{
    columns: string[];
    rows: any[];
  } | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [selectedDb, setSelectedDb] = useState<"proof.db" | "proof_auth.db">(
    "proof.db"
  );
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

  // Check admin access on mount
  useEffect(() => {
    if (!user || user.id !== ADMIN_USER_ID) {
      Alert.alert(
        "Access Denied",
        "You do not have permission to access the Admin Dashboard.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [user, navigation]);
  const scrollViewRef = useRef<ScrollView>(null);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const loadData = async () => {
    // Only load data if user is admin
    if (!user || user.id !== ADMIN_USER_ID) {
      return;
    }

    try {
      setLoading(true);
      const info = await getDatabaseInfo();
      setDbInfo(info);

      if (activeTab === "records") {
        const recordsData = await getAllRecordsWithDetails();
        setRecords(recordsData);
      } else if (activeTab === "users") {
        const usersData = await getAllUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      Alert.alert("Error", "Failed to load database information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadData();
    }, [activeTab])
  );

  const handleExecuteQuery = async () => {
    if (!queryText.trim()) {
      Alert.alert("Error", "Please enter a SQL query.");
      return;
    }

    try {
      setQueryLoading(true);
      const results = await executeQuery(selectedDb, queryText);
      setQueryResults(results);
    } catch (error: any) {
      Alert.alert("Query Error", error.message || "Failed to execute query.");
      setQueryResults(null);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleExportDatabase = async (dbName: "proof.db" | "proof_auth.db") => {
    try {
      // Note: expo-sqlite databases are not directly accessible as files
      // This would need to be implemented differently - showing a message for now
      Alert.alert(
        "Export Database",
        `To export ${dbName}, you can use:\n\n• iOS Simulator: Find the app container\n• Android: Use ADB to pull the database\n\nOr use the "Export All Data" feature in Settings for records.`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to export database.");
    }
  };

  const renderOverview = () => {
    if (!dbInfo) return null;

    return (
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={32} color="#000" />
              <Text style={styles.statValue}>{dbInfo.recordsCount}</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="images" size={32} color="#000" />
              <Text style={styles.statValue}>{dbInfo.photosCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={32} color="#000" />
              <Text style={styles.statValue}>{dbInfo.usersCount}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Tables</Text>
          <View style={styles.card}>
            {dbInfo.tables.map((table, index) => (
              <View
                key={table}
                style={[
                  styles.listItem,
                  index < dbInfo.tables.length - 1 && styles.listItemBorder,
                ]}
              >
                <Ionicons name="grid-outline" size={20} color="#666" />
                <Text style={styles.listItemText}>{table}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExportDatabase("proof.db")}
            >
              <Ionicons name="download-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Export proof.db</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExportDatabase("proof_auth.db")}
            >
              <Ionicons name="download-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Export proof_auth.db</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderRecords = () => {
    return (
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Records ({records.length})
          </Text>
          {records.map((record, index) => (
            <TouchableOpacity
              key={record.dateKey}
              style={[
                styles.recordCard,
                index < records.length - 1 && styles.recordCardBorder,
              ]}
              onPress={() =>
                navigation.navigate("DayDetail", { dateKey: record.dateKey })
              }
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>
                  {formatDateKey(record.dateKey)}
                </Text>
                <View style={styles.recordMeta}>
                  <Ionicons name="images-outline" size={16} color="#666" />
                  <Text style={styles.recordMetaText}>
                    {record.photosCount}
                  </Text>
                </View>
              </View>
              <Text style={styles.recordNote} numberOfLines={2}>
                {record.note || "(no note)"}
              </Text>
              <Text style={styles.recordTime}>
                Created: {formatTimestamp(record.createdAt)}
              </Text>
              <Text style={styles.recordHash} numberOfLines={1}>
                Hash: {record.recordHash.substring(0, 16)}...
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderUsers = () => {
    return (
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
          {users.map((user, index) => {
            const isExpanded = expandedUsers.includes(user.id);
            return (
              <Pressable
                key={user.id}
                style={({ pressed }) => [
                  styles.card,
                  index < users.length - 1 && styles.cardSpacing,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => toggleUserExpanded(user.id)}
              >
                <View style={styles.userRow}>
                  <Ionicons
                    name="person-circle-outline"
                    size={32}
                    color="#000"
                  />
                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#666"
                      />
                    </View>

                    {/* Always visible - summary */}
                    <View style={styles.userFieldRow}>
                      <Ionicons name="mail-outline" size={16} color="#666" />
                      <Text style={styles.userFieldLabel}>Email:</Text>
                      <Text style={styles.userFieldValue}>{user.email}</Text>
                    </View>

                    {/* Collapsible details */}
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.userFieldRow}>
                          <Ionicons name="key-outline" size={16} color="#666" />
                          <Text style={styles.userFieldLabel}>ID:</Text>
                          <Text style={styles.userFieldValue} numberOfLines={0}>
                            {user.id}
                          </Text>
                        </View>

                        <View style={styles.userFieldRow}>
                          <Ionicons
                            name="lock-closed-outline"
                            size={16}
                            color="#666"
                          />
                          <Text style={styles.userFieldLabel}>
                            Password Hash:
                          </Text>
                          <Text style={styles.userFieldValue} numberOfLines={0}>
                            {user.passwordHash}
                          </Text>
                        </View>

                        <View style={styles.userFieldRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color="#666"
                          />
                          <Text style={styles.userFieldLabel}>Created:</Text>
                          <Text style={styles.userFieldValue}>
                            {formatTimestamp(user.createdAt)}
                          </Text>
                        </View>

                        <View style={styles.userFieldRow}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#666"
                          />
                          <Text style={styles.userFieldLabel}>Timestamp:</Text>
                          <Text style={styles.userFieldValue}>
                            {user.createdAt}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderQuery = () => {
    return (
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SQL Query Executor</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Database</Text>
            <View style={styles.dbSelector}>
              <TouchableOpacity
                style={[
                  styles.dbButton,
                  selectedDb === "proof.db" && styles.dbButtonActive,
                ]}
                onPress={() => setSelectedDb("proof.db")}
              >
                <Text
                  style={[
                    styles.dbButtonText,
                    selectedDb === "proof.db" && styles.dbButtonTextActive,
                  ]}
                >
                  proof.db
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dbButton,
                  selectedDb === "proof_auth.db" && styles.dbButtonActive,
                ]}
                onPress={() => setSelectedDb("proof_auth.db")}
              >
                <Text
                  style={[
                    styles.dbButtonText,
                    selectedDb === "proof_auth.db" && styles.dbButtonTextActive,
                  ]}
                >
                  proof_auth.db
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>SQL Query (SELECT only)</Text>
            <TextInput
              style={styles.queryInput}
              multiline
              numberOfLines={4}
              value={queryText}
              onChangeText={setQueryText}
              placeholder="SELECT * FROM records LIMIT 10"
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.executeButton}
              onPress={handleExecuteQuery}
              disabled={queryLoading}
            >
              {queryLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="play-outline" size={20} color="#fff" />
                  <Text style={styles.executeButtonText}>Execute Query</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {queryResults && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Results ({queryResults.rows.length} rows)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    {queryResults.columns.map((col, idx) => (
                      <View key={idx} style={styles.tableHeaderCell}>
                        <Text style={styles.tableHeaderText}>{col}</Text>
                      </View>
                    ))}
                  </View>
                  {queryResults.rows.map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.tableRow}>
                      {queryResults.columns.map((col, colIdx) => (
                        <View key={colIdx} style={styles.tableCell}>
                          <Text style={styles.tableCellText} numberOfLines={2}>
                            {String(row[col] ?? "null")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Don't render dashboard if user is not admin
  if (!user || user.id !== ADMIN_USER_ID) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 20,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Access Denied</Text>
        <Text style={{ color: "#666", marginTop: 8 }}>
          You do not have permission to access this screen.
        </Text>
      </View>
    );
  }

  if (loading && !dbInfo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "overview" && styles.tabActive]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.tabTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "records" && styles.tabActive]}
            onPress={() => setActiveTab("records")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "records" && styles.tabTextActive,
              ]}
            >
              Records
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "users" && styles.tabActive]}
            onPress={() => setActiveTab("users")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "users" && styles.tabTextActive,
              ]}
            >
              Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "query" && styles.tabActive]}
            onPress={() => setActiveTab("query")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "query" && styles.tabTextActive,
              ]}
            >
              Query
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "records" &&
          (loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            renderRecords()
          ))}
        {activeTab === "users" &&
          (loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            renderUsers()
          ))}
        {activeTab === "query" && renderQuery()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  tabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#000",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: "#f9f9f9",
  },
  cardSpacing: {
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listItemText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  recordCardBorder: {
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  recordMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recordMetaText: {
    fontSize: 14,
    color: "#666",
  },
  recordNote: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  recordTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  recordHash: {
    fontSize: 10,
    color: "#999",
    fontFamily: "monospace",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  userFieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 6,
  },
  userFieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    minWidth: 110,
    marginTop: 2,
  },
  userFieldValue: {
    fontSize: 13,
    color: "#000",
    flex: 1,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  dbSelector: {
    flexDirection: "row",
    gap: 8,
  },
  dbButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  dbButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  dbButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  dbButtonTextActive: {
    color: "#fff",
  },
  queryInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "monospace",
    backgroundColor: "#fafafa",
    minHeight: 100,
    marginBottom: 12,
  },
  executeButton: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  executeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tableContainer: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    padding: 12,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    padding: 12,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
  },
  tableCellText: {
    fontSize: 12,
    color: "#666",
  },
});
