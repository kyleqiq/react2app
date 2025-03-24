// Directory names
export const DIRECTORY_NAMES = {
  R2A: "react2app",
  TEMPLATES: "templates",
} as const;

// File names organized by project
export const FILE_NAMES = {
  R2A: {
    CONFIG: "react2app.config.js",
    CONFIG_TEMPLATE: "react2app.config.template.js",
    SYSTEM: ".server.json",
  },
  NEXTJS: {
    ENV: ".env.local",
    CONFIG: "react2app.config.ts",
    LAYOUT: "layout.tsx",
  },
  EXPO: {
    ENV: ".env",
    APP_CONFIG: "app.json",
    CONFIG: "app.json",
    TEMPLATE: "@react2app/expo-template",
  },
  ANDROID: {
    KEYSTORE: "release.keystore",
    KEY_ALIAS: "upload",
  },
} as const;

export const WEB_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007];
export const EXPO_PORTS = [8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088];
