# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate app assets (optional but recommended):**
   ```bash
   npx expo install expo-asset
   ```
   For MVP, you can skip asset generation - Expo will use default placeholders.

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on simulator/device:**
   - Press `i` for iOS simulator (requires macOS with Xcode)
   - Press `a` for Android emulator (requires Android Studio)
   - Scan QR code with Expo Go app on physical device

## Project Structure

```
proof/
├── App.tsx                      # Main app entry with navigation setup
├── index.js                     # Expo entry point
├── package.json                 # Dependencies and scripts
├── app.json                     # Expo configuration
├── tsconfig.json                # TypeScript configuration
├── babel.config.js              # Babel configuration
├── jest.config.js               # Jest test configuration
├── src/
│   ├── db/
│   │   └── database.ts          # SQLite database layer with schema
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Main home screen with today's status
│   │   ├── LogTodayScreen.tsx   # Create today's proof
│   │   ├── DayDetailScreen.tsx  # View proof with integrity check
│   │   ├── HistoryScreen.tsx    # Last 30 days history
│   │   └── AboutScreen.tsx      # App information
│   ├── utils/
│   │   ├── hashing.ts           # SHA-256 hashing and verification
│   │   ├── fileSystem.ts        # Photo file storage
│   │   ├── dateUtils.ts         # Date formatting utilities
│   │   └── pdfExport.ts         # PDF generation and sharing
│   ├── types/
│   │   └── navigation.ts        # Navigation type definitions
│   └── __tests__/
│       └── hashing.test.ts      # Unit tests for hashing
└── assets/                      # App icons and splash screens (optional)

```

## Key Features Implementation

### Database
- SQLite database initialized on app start
- Two tables: `records` and `photos`
- Immutable records (no update/delete operations)

### Photo Storage
- Photos copied to `FileSystem.documentDirectory/proof_photos/`
- Each photo stored with UUID filename
- SHA-256 hash computed and stored for integrity

### Integrity Verification
- Record hash computed from canonical JSON representation
- Includes date, timestamp, note, and sorted photo hashes
- Verification recomputes hash and compares with stored value

### PDF Export
- HTML template with embedded images (base64)
- Includes all record data and integrity hash
- Shared via expo-sharing share sheet

## Testing

Run tests:
```bash
npm test
```

## Platform Permissions

### iOS
- Camera permission requested automatically
- Photo library permission requested automatically
- Configured in `app.json` under `ios.infoPlist`

### Android
- Camera permission declared in manifest
- Storage permissions declared in manifest
- User may need to grant permissions manually on first use

## Troubleshooting

### Database not initializing
- Ensure expo-sqlite is properly installed
- Check that app has proper storage permissions

### Photos not saving
- Verify camera/photo library permissions are granted
- Check device storage space
- Ensure expo-file-system has proper permissions

### PDF export not working
- Verify expo-print and expo-sharing are installed
- Check that device supports sharing functionality

### Hash verification failing
- Ensure photos haven't been modified outside the app
- Check that file URIs are still valid
- Verify file system integrity

## Production Build

For production builds, use EAS Build:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
```

## Notes

- App is fully offline - no network calls
- Data stored only on device
- No user accounts or authentication
- Records are immutable once saved
- Maximum 3 photos per proof
- History shows last 30 days only
