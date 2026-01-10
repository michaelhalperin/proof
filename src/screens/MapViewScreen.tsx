import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Platform } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { getAllRecords } from "../db/database";
import { Record } from "../db/database";
import { parseLocation, LocationData } from "../utils/location";
import { formatDateKey } from "../utils/dateUtils";
import { getFontFamily } from "../config/theme";

type MapViewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

interface RecordWithLocation extends Record {
  locationData: LocationData;
}

export default function MapViewScreen() {
  const navigation = useNavigation<MapViewScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<RecordWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const allRecords = await getAllRecords();

      // Filter records with location and parse location data
      const recordsWithLocation: RecordWithLocation[] = [];
      allRecords.forEach((record) => {
        if (record.location) {
          const locationData = parseLocation(record.location);
          if (locationData) {
            recordsWithLocation.push({
              ...record,
              locationData,
            });
          }
        }
      });

      setRecords(recordsWithLocation);

      // Fit map to show all markers
      if (recordsWithLocation.length > 0 && mapRef.current) {
        const coordinates = recordsWithLocation.map((r) => ({
          latitude: r.locationData.latitude,
          longitude: r.locationData.longitude,
        }));

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 100,
            left: 50,
          },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Error loading records:", error);
      Alert.alert("Error", "Failed to load records with location data.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const handleMarkerPress = (record: RecordWithLocation) => {
    navigation.navigate("DayDetail", { dateKey: record.dateKey });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Location Data</Text>
          <Text style={styles.emptyText}>
            Records with location data will appear on the map.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadRecords}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={{
          latitude: records[0]?.locationData.latitude || 37.78825,
          longitude: records[0]?.locationData.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {records.map((record) => (
          <Marker
            key={record.dateKey}
            coordinate={{
              latitude: record.locationData.latitude,
              longitude: record.locationData.longitude,
            }}
            title={formatDateKey(record.dateKey)}
            description={
              record.locationData.address ||
              `${record.locationData.latitude.toFixed(
                4
              )}, ${record.locationData.longitude.toFixed(4)}`
            }
            onPress={() => handleMarkerPress(record)}
          />
        ))}
      </MapView>

      <View style={[styles.infoContainer, { top: insets.top + 20 }]}>
        <View style={styles.infoCard}>
          <Ionicons name="location" size={20} color="#000" />
          <Text style={styles.infoText}>
            {records.length} {records.length === 1 ? "record" : "records"} with
            location
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButtonSmall}
          onPress={loadRecords}
        >
          <Ionicons name="refresh" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  refreshButtonSmall: {
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
