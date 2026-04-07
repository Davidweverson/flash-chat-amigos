// Global settings store persisted in localStorage

export interface FlashChatSettings {
  // Appearance
  primaryColor: string; // HSL string like "190 80% 50%"
  fontSize: "small" | "medium" | "large";
  showAvatars: boolean;
  reducedMotion: boolean;

  // Notifications
  notificationsDisabled: boolean;
  messageSounds: boolean;
  browserNotifications: boolean;
  showMessagePreview: boolean;

  // Chat
  showTypingIndicator: boolean;
  sendWithEnter: boolean;
  showTimestamp: boolean;
  language: "pt" | "en";

  // Privacy
  showOnlineStatus: boolean;
}

export const DEFAULT_SETTINGS: FlashChatSettings = {
  primaryColor: "190 80% 50%",
  fontSize: "medium",
  showAvatars: true,
  reducedMotion: false,
  notificationsDisabled: false,
  messageSounds: true,
  browserNotifications: false,
  showMessagePreview: true,
  showTypingIndicator: true,
  sendWithEnter: true,
  showTimestamp: true,
  language: "pt",
  showOnlineStatus: true,
};

const STORAGE_KEY = "flashchat_settings";

export function loadSettings(): FlashChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: FlashChatSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applySettings(settings);
}

export function applySettings(settings: FlashChatSettings) {
  const root = document.documentElement;

  // Primary color
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--ring", settings.primaryColor);
  root.style.setProperty("--sidebar-primary", settings.primaryColor);
  root.style.setProperty("--sidebar-ring", settings.primaryColor);
  root.style.setProperty("--glow-primary", settings.primaryColor);

  // Font size
  const sizes = { small: "13px", medium: "14px", large: "16px" };
  root.style.setProperty("--chat-font-size", sizes[settings.fontSize]);

  // Reduced motion
  if (settings.reducedMotion) {
    root.classList.add("reduce-motion");
  } else {
    root.classList.remove("reduce-motion");
  }
}

// Theme management
export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "flashchat_theme";

export function loadTheme(): ThemeMode {
  return (localStorage.getItem(THEME_KEY) as ThemeMode) || "system";
}

export function saveTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  let dark: boolean;

  if (mode === "system") {
    dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    dark = mode === "dark";
  }

  if (dark) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
}

// Color presets
export const COLOR_PRESETS = [
  { name: "Ciano", value: "190 80% 50%" },
  { name: "Azul", value: "220 80% 55%" },
  { name: "Verde", value: "145 70% 45%" },
  { name: "Laranja", value: "25 90% 55%" },
  { name: "Rosa", value: "330 80% 55%" },
  { name: "Vermelho", value: "0 80% 55%" },
];
