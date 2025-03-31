const config = {
  projectName: null,
  displayName: null,
  appId: null,
  productionUrl: "https://example.com",
  version: "1.0.0",
  scheme: "yourscheme",
  ios: {
    teamId: process.env.R2A_IOS_TEAM_ID,
  },
  android: {
    keyStore: {
      keystorePath: "./react2app/upload.keystore",
      keystorePassword: process.env.R2A_ANDROID_KEYSTORE_PASSWORD,
      keyAlias: "upload",
      keyPassword: process.env.R2A_ANDROID_KEY_PASSWORD,
    },
  },
  design: {
    icon: "./react2app/design/icon.png",
    splash: {
      backgroundColor: "#ffffff",
      image: "./react2app/design/splash.png",
      imageWidth: 200,
    },
  },
};

module.exports = config;
