require('dotenv').config();

module.exports = {
  expo: {
    name: "Proof",
    slug: "proof",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    extra: {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM || "onboarding@resend.dev",
      eas: {
        projectId: "0702398c-4dc2-4201-a11c-3bf479012380"
      }
    },
    icon: "./assets/icon.png",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    scheme: "proof",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.proof.app",
      icon: "./assets/icon.png",
      infoPlist: {
        NSCameraUsageDescription: "Proof needs camera access to take photos for your daily evidence log.",
        NSPhotoLibraryUsageDescription: "Proof needs photo library access to select photos for your daily evidence log.",
        NSLocationWhenInUseUsageDescription: "Proof needs location access to optionally tag your proof records with location data.",
        UIFileSharingEnabled: true,
        LSSupportsOpeningDocumentsInPlace: true
      }
    },
    android: {
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/android-adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.proof.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "proof"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ],
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "Proof needs photo library access to select photos for your daily evidence log.",
          cameraPermission: "Proof needs camera access to take photos for your daily evidence log."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#000000"
        }
      ],
      "expo-secure-store"
    ]
  }
};

