import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";

const CLEARED_FLAG_KEY = "localSqliteDataCleared";

/**
 * Deletes all data from local SQLite databases (proof.db and proof_auth.db).
 * Runs once per install; uses SecureStore to remember it has run.
 * Safe to call on every app launch—will no-op after first run.
 */
export async function clearLocalSqliteIfNeeded(): Promise<void> {
  try {
    const alreadyCleared = await SecureStore.getItemAsync(CLEARED_FLAG_KEY);
    if (alreadyCleared === "true") {
      return;
    }

    const proofDb = await SQLite.openDatabaseAsync("proof.db");
    await proofDb.runAsync("DELETE FROM photos");
    await proofDb.runAsync("DELETE FROM records");
    await proofDb.closeAsync();

    const authDb = await SQLite.openDatabaseAsync("proof_auth.db");
    await authDb.runAsync("DELETE FROM users");
    await authDb.closeAsync();

    await SecureStore.setItemAsync(CLEARED_FLAG_KEY, "true");
  } catch (error) {
    // If DBs don't exist or tables differ, ignore so app still starts
    console.warn("clearLocalSqlite: could not clear (non-fatal):", error);
  }
}
