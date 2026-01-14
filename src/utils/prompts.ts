import * as SecureStore from "expo-secure-store";

const PROMPTS_KEY = "journal_prompts";
const ENABLED_KEY = "journal_prompts_enabled";

const DEFAULT_PROMPTS = [
  "What's one thing you want to remember today?",
  "What was the highlight of your day?",
  "What are you grateful for today?",
  "What did you learn today?",
  "What made you smile today?",
];

export interface JournalPrompt {
  id: string;
  text: string;
}

/**
 * Get all custom journal prompts
 */
export async function getPrompts(): Promise<JournalPrompt[]> {
  try {
    const stored = await SecureStore.getItemAsync(PROMPTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PROMPTS.map((text, index) => ({
      id: `default-${index}`,
      text,
    }));
  } catch (error) {
    console.error("Error getting prompts:", error);
    return DEFAULT_PROMPTS.map((text, index) => ({
      id: `default-${index}`,
      text,
    }));
  }
}

/**
 * Save custom journal prompts
 */
export async function savePrompts(prompts: JournalPrompt[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(PROMPTS_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error("Error saving prompts:", error);
    throw error;
  }
}

/**
 * Add a new prompt
 */
export async function addPrompt(text: string): Promise<JournalPrompt> {
  const prompts = await getPrompts();
  const newPrompt: JournalPrompt = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
  };
  const updatedPrompts = [...prompts, newPrompt];
  await savePrompts(updatedPrompts);
  return newPrompt;
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<void> {
  const prompts = await getPrompts();
  const updatedPrompts = prompts.filter((p) => p.id !== id);
  await savePrompts(updatedPrompts);
}

/**
 * Check if prompts are enabled
 */
export async function arePromptsEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(ENABLED_KEY);
    return value === "true";
  } catch (error) {
    return true; // Default to enabled
  }
}

/**
 * Enable or disable prompts
 */
export async function setPromptsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(ENABLED_KEY, enabled.toString());
}

/**
 * Get a random prompt
 */
export async function getRandomPrompt(): Promise<string | null> {
  const enabled = await arePromptsEnabled();
  if (!enabled) {
    return null;
  }

  const prompts = await getPrompts();
  if (prompts.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex].text;
}

