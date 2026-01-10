/**
 * Simple event emitter for tab preference changes
 * Allows Settings screen to notify TabNavigator when preferences change
 */

type Listener = () => void;

class TabPreferencesListener {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("Error in tab preferences listener:", error);
      }
    });
  }
}

export const tabPreferencesListener = new TabPreferencesListener();

