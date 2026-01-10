import React, { useState, useCallback, useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LayoutAnimation, Platform, UIManager } from "react-native";
import { TabParamList } from "../types/navigation";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import MapViewScreen from "../screens/MapViewScreen";
import StatisticsScreen from "../screens/StatisticsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { isStatisticsTabVisible, isMapTabVisible } from "../utils/preferences";
import { tabPreferencesListener } from "../utils/tabPreferencesListener";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const [showStatisticsTab, setShowStatisticsTab] = useState<boolean>(true);
  const [showMapTab, setShowMapTab] = useState<boolean>(true);
  const navigatorKeyRef = useRef(0);

  const loadTabPreferences = useCallback(async () => {
    try {
      const statsVisible = await isStatisticsTabVisible();
      const mapVisible = await isMapTabVisible();
      
      // Only update if values actually changed
      if (statsVisible !== showStatisticsTab || mapVisible !== showMapTab) {
        // Configure smooth layout animation
        LayoutAnimation.configureNext({
          duration: 250,
          create: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
          update: {
            type: LayoutAnimation.Types.easeInEaseOut,
          },
          delete: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
        });

        setShowStatisticsTab(statsVisible);
        setShowMapTab(mapVisible);
        navigatorKeyRef.current += 1;
      }
    } catch (error) {
      console.error("Error loading tab preferences:", error);
    }
  }, [showStatisticsTab, showMapTab]);

  useEffect(() => {
    loadTabPreferences();

    // Subscribe to tab preference change notifications
    const unsubscribe = tabPreferencesListener.subscribe(() => {
      // Small delay to ensure preferences are saved
      setTimeout(() => {
        loadTabPreferences();
      }, 100);
    });

    return unsubscribe;
  }, [loadTabPreferences]);

  // Reload preferences when Settings tab loses focus (fallback)
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadTabPreferences();
      }, 200);
      return () => clearTimeout(timer);
    }, [loadTabPreferences])
  );

  return (
    <Tab.Navigator
      key={`tabs-${navigatorKeyRef.current}`}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 50 + (insets.bottom > 0 ? insets.bottom - 8 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 6,
          paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: "#e5e5e5",
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {showMapTab && (
        <Tab.Screen
          name="Map"
          component={MapViewScreen}
          options={{
            tabBarLabel: "Map",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "map" : "map-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      )}
      {showStatisticsTab && (
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            tabBarLabel: "Stats",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        listeners={{
          blur: () => {
            // Reload preferences when leaving Settings (user may have toggled tabs)
            setTimeout(() => {
              loadTabPreferences();
            }, 200);
          },
        }}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
