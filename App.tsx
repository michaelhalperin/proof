import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, Linking } from "react-native";
import { initDatabase } from "./src/db/database";
import { initializeNotifications } from "./src/utils/notifications";
import { RootStackParamList } from "./src/types/navigation";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { logError, logInfo } from "./src/utils/logger";
import TabNavigator from "./src/navigation/TabNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import LogTodayScreen from "./src/screens/LogTodayScreen";
import DayDetailScreen from "./src/screens/DayDetailScreen";
import AboutScreen from "./src/screens/AboutScreen";
import PrivacyScreen from "./src/screens/PrivacyScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import HelpScreen from "./src/screens/HelpScreen";
import OnboardingScreen, { hasCompletedOnboarding } from "./src/screens/OnboardingScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = React.useRef<any>(null);
  const [showOnboarding, setShowOnboarding] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Check if user has completed onboarding
    if (isAuthenticated && showOnboarding === null) {
      hasCompletedOnboarding().then((completed) => {
        setShowOnboarding(!completed);
      });
    } else if (!isAuthenticated) {
      setShowOnboarding(null);
    }
  }, [isAuthenticated]);

  if (isLoading || (isAuthenticated && showOnboarding === null)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Show onboarding for authenticated users who haven't completed it
  if (isAuthenticated && showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#000",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerBackTitle: "",
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main app screens
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LogToday"
              component={LogTodayScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DayDetail"
              component={DayDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Help"
              component={HelpScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize database on app start
    initDatabase().catch((error) => {
      logError("Failed to initialize database", {}, error);
    });

    // Initialize notifications (reminders)
    initializeNotifications().catch((error) => {
      logError("Failed to initialize notifications", {}, error);
    });

    logInfo("App initialized");
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
