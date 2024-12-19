// Directory names
export const DIRECTORY_NAMES = {
  N2A: "next2app",
  TEMPLATES: "templates",
} as const;

// File names organized by project
export const FILE_NAMES = {
  N2A: {
    CONFIG: "next2app.config.js",
    CONFIG_TEMPLATE: "next2app.config.template.js",
    SYSTEM: ".server.json",
  },
  NEXTJS: {
    ENV: ".env.local",
    CONFIG: "next.config.ts",
    LAYOUT: "layout.tsx",
  },
  EXPO: {
    ENV: ".env",
    APP_CONFIG: "app.json",
    CONFIG: "app.json",
    TEMPLATE: "@next2app/expo-template",
  },
  ANDROID: {
    KEYSTORE: "release.keystore",
    KEY_ALIAS: "upload",
  },
} as const;

export const WEB_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007];
export const EXPO_PORTS = [8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088];
