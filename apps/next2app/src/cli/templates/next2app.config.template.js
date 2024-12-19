const config = {
  projectName: null,
  displayName: null,
  appId: null,
  version: "1.0.0",
  scheme: "yourscheme",
  ios: {
    teamId: process.env.N2A_IOS_TEAM_ID,
  },
  android: {
    keyStore: {
      keystorePath: "./release.keystore",
      keystorePassword: process.env.N2A_ANDROID_KEYSTORE_PASSWORD,
      keyAlias: "upload",
      keyPassword: process.env.N2A_ANDROID_KEY_PASSWORD,
    },
  },
  design: {
    icon: "./next2app/design/icon.png",
    splash: {
      backgroundColor: "#ffffff",
      image: "./next2app/design/splash.png",
      imageWidth: 200,
    },
  },
};

module.exports = config;
