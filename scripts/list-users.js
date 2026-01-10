// Script to list all users from the SQLite database
// Note: This requires the database to be accessible locally
// For device/simulator, you may need to use ADB or other methods to access the database file

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// Try to find the database file
// On iOS Simulator: ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/proof_auth.db
// On Android: /data/data/com.proof.app/files/proof_auth.db

// Common locations to check
const possiblePaths = [
  // Development/Expo Go
  path.join(os.homedir(), '.expo', 'proof_auth.db'),
  path.join(process.cwd(), 'proof_auth.db'),
  // iOS Simulator (if we can detect it)
  // Android (if we can detect it)
];

console.log('Looking for proof_auth.db database file...\n');

let dbPath = null;
for (const dbPathCandidate of possiblePaths) {
  if (fs.existsSync(dbPathCandidate)) {
    dbPath = dbPathCandidate;
    console.log(`Found database at: ${dbPath}\n`);
    break;
  }
}

if (!dbPath) {
  console.log('Database file not found in common locations.');
  console.log('\nTo find the database file:');
  console.log('iOS Simulator:');
  console.log('  1. Open Terminal');
  console.log('  2. Run: xcrun simctl get_app_container booted com.proof.app');
  console.log('  3. Navigate to the Documents folder');
  console.log('  4. Look for proof_auth.db');
  console.log('\nAndroid:');
  console.log('  1. Use ADB: adb exec-out run-as com.proof.app cat files/proof_auth.db > proof_auth.db');
  console.log('\nAlternatively, check the Admin Dashboard in the app to see all users.');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database.\n');
});

db.all('SELECT id, email, name, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
  if (err) {
    console.error('Error querying users:', err.message);
    db.close();
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('No users found in the database.');
  } else {
    console.log(`Found ${rows.length} user(s):\n`);
    console.log('User IDs:');
    console.log('─'.repeat(80));
    rows.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
    });
    console.log('\n' + '─'.repeat(80));
    console.log(`\nTotal: ${rows.length} user(s)`);
  }

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
  });
});

