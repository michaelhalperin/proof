/**
 * Export SQLite data to JSON files for migration to MongoDB
 * Run this from the Expo app or as a standalone script
 */

const SQLite = require("expo-sqlite");
const fs = require("fs").promises;
const path = require("path");

async function exportData() {
  try {
    // Open databases
    const db = await SQLite.openDatabaseAsync("proof.db");
    const authDb = await SQLite.openDatabaseAsync("proof_auth.db");

    // Export records
    const records = await db.getAllAsync(`
      SELECT * FROM records ORDER BY dateKey
    `);

    // Export photos
    const photos = await db.getAllAsync(`
      SELECT * FROM photos ORDER BY dateKey, sortIndex
    `);

    // Group photos by dateKey
    const photosByDateKey = {};
    photos.forEach(photo => {
      if (!photosByDateKey[photo.dateKey]) {
        photosByDateKey[photo.dateKey] = [];
      }
      photosByDateKey[photo.dateKey].push(photo);
    });

    // Combine records with photos
    const recordsWithPhotos = records.map(record => ({
      ...record,
      pinned: record.pinned === 1 || record.pinned === true,
      photos: photosByDateKey[record.dateKey] || [],
    }));

    // Export users
    const users = await authDb.getAllAsync(`
      SELECT * FROM users
    `);

    const usersData = users.map(user => ({
      ...user,
      emailVerified: user.emailVerified === 1 || user.emailVerified === true,
    }));

    // Write to JSON files
    const exportDir = path.join(__dirname, "../server/migration-data");
    await fs.mkdir(exportDir, { recursive: true });

    await fs.writeFile(
      path.join(exportDir, "records.json"),
      JSON.stringify(recordsWithPhotos, null, 2)
    );

    await fs.writeFile(
      path.join(exportDir, "users.json"),
      JSON.stringify(usersData, null, 2)
    );

    console.log(`✓ Exported ${recordsWithPhotos.length} records`);
    console.log(`✓ Exported ${usersData.length} users`);
    console.log(`✓ Files saved to ${exportDir}`);

    await db.closeAsync();
    await authDb.closeAsync();
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

// Note: This script needs to be adapted based on your environment
// For Expo, you might need to run it differently or use a different approach
console.log("⚠️  This script needs to be adapted for your environment");
console.log("Consider using the API endpoints to export data instead");

exportData().catch(console.error);
