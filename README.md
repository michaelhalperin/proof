# Proof

An offline-first, privacy-first daily evidence log app built with React Native and Expo.

## Features

- **Offline-first**: Works completely without internet connection
- **Privacy-first**: All data stored locally on device, no accounts, no cloud
- **Tamper-evident**: SHA-256 cryptographic hashing for integrity verification
- **Immutable records**: Once saved, records cannot be edited or deleted
- **PDF Export**: Export any proof record as a PDF for sharing
- **Simple UI**: Minimal, serious design focused on utility

## Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (installed automatically with `npx expo`)
- iOS Simulator (for macOS) or Android Studio/emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Platform-Specific Notes

### iOS

- Camera and photo library permissions are automatically requested
- Permissions are declared in `app.json` under `ios.infoPlist`

### Android

- Camera and storage permissions are declared in `app.json`
- May require manual permission grants on some Android versions

## Project Structure

```
proof/
├── App.tsx                 # Main app entry with navigation
├── src/
│   ├── db/
│   │   └── database.ts     # SQLite database layer
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── LogTodayScreen.tsx
│   │   ├── DayDetailScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── AboutScreen.tsx
│   ├── utils/
│   │   ├── hashing.ts      # SHA-256 hashing utilities
│   │   ├── fileSystem.ts   # File storage utilities
│   │   ├── dateUtils.ts    # Date formatting utilities
│   │   └── pdfExport.ts    # PDF generation and sharing
│   └── types/
│       └── navigation.ts   # TypeScript navigation types
└── package.json
```

## Data Model

### SQLite Tables

**records**
- `dateKey` (TEXT PRIMARY KEY): Date in YYYY-MM-DD format
- `createdAt` (INTEGER): Unix timestamp in milliseconds
- `note` (TEXT): Optional note text
- `recordHash` (TEXT): SHA-256 hash of the canonical record
- `algo` (TEXT): Hash algorithm (always "SHA-256")

**photos**
- `id` (TEXT PRIMARY KEY): Unique photo identifier (UUID)
- `dateKey` (TEXT): Foreign key to records.dateKey
- `fileUri` (TEXT): Local file path in app storage
- `mimeType` (TEXT): MIME type (e.g., "image/jpeg")
- `sha256` (TEXT): SHA-256 hash of photo file
- `sortIndex` (INTEGER): Display order (0-2)

### Hash Verification

Records use a canonical JSON representation that includes:
- Date key
- Creation timestamp
- Note text
- Photos (sorted by sortIndex, then id) with their hashes

The record hash is computed as: `SHA-256(stableStringify(canonicalRecord))`

## Testing

Run tests with:
```bash
npm test
```

Tests cover:
- Stable stringify for deterministic JSON
- Record hash computation
- Hash verification

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

Note: You'll need to set up EAS (Expo Application Services) for production builds.

## Privacy & Security

- **No network requests**: The app never makes network calls
- **Local-only storage**: All data stored in SQLite and app document directory
- **No analytics**: No tracking or analytics
- **No accounts**: No user authentication or cloud sync
- **Tamper-evident**: Cryptographic hashing ensures record integrity

## License

Private / Proprietary

## Support

This is a production-ready MVP. For issues or questions, refer to the codebase documentation in each file.
