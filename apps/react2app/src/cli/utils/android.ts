import inquirer from "inquirer";
import fs from "fs-extra";
import { FILE_NAMES } from "../config/constants.js";
import { PATHS } from "./path.js";
import { runSpawn } from "./program.js";
import { homedir } from "os";
import path from "path";
import dotenv from "dotenv";
import { ensureR2AConfig } from "./config.js";
import { updateEnvFile } from "./env.js";

export const generateKeyStore = async (options: {
  keyStorePath: string;
  keyAlias: string;
  keyStorePassword: string;
  keyPassword: string;
}) => {
  try {
    await runSpawn("keytool", [
      "-genkey",
      "-v",
      "-keystore",
      options.keyStorePath,
      "-alias",
      options.keyAlias,
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
      "-dname",
      `CN=React2App, OU=React2App, O=React2App, L=React2App, ST=React2App, C=US`,
      "-storepass",
      options.keyStorePassword,
      "-keypass",
      options.keyPassword,
    ]);
  } catch (e) {
    console.error(e);
    throw e;
  }
  return {
    keyStorePath: options.keyStorePath,
    keyStorePassword: options.keyStorePassword,
    keyAlias: options.keyAlias,
    keyPassword: options.keyPassword,
  };
};

// Key Store
export const ensureR2AKeyStore = async () => {
  const R2AConfig = await ensureR2AConfig();
  const { ANDROID } = await PATHS.getExpoPaths();
  const isKeyStoreExist = await fs.existsSync(
    path.resolve(process.cwd(), R2AConfig.android.keyStore.keystorePath)
  );

  // If key store does not exist, generate it
  if (!isKeyStoreExist) {
    console.log("\n");
    const { password } = await inquirer.prompt([
      {
        type: "password",
        name: "password",
        message:
          "🔐  Creating a KeyStore...\n\n" +
          "To upload your app to the Play Store, you need a signed .aab file!\n" +
          "Think of this like your personal signature on build file saying\n" +
          '"Yes, this is my app, and I approve this build."\n' +
          "Since you haven't provided a proper keystore in react2app.config.js, we'll create one for you.\n\n" +
          "Please type the new password for your keystore (at least 6 characters):",
        validate: (input: string) => {
          if (input.length < 6) {
            return "Password must be at least 6 characters long";
          }
          return true;
        },
      },
    ]);

    const keyStore = await generateKeyStore({
      keyStorePath: ANDROID.KEYSTORE,
      keyStorePassword: password,
      keyAlias: FILE_NAMES.ANDROID.KEY_ALIAS,
      keyPassword: password,
    });

    console.log(
      "\nKeystore created successfully! You can find it in /react2app folder\n"
    );

    await updateEnvFile(PATHS.NEXTJS.ENV_FILE, {
      R2A_ANDROID_KEYSTORE_PASSWORD: password,
      R2A_ANDROID_KEY_PASSWORD: password,
    });
    return keyStore;
  }

  // If key store exists but password is not set, throw error
  const isPasswordSet =
    R2AConfig.android.keyStore.keystorePassword &&
    R2AConfig.android.keyStore.keyPassword;

  if (!isPasswordSet) {
    throw new Error(
      "Key store already exists but password is not set, please set the keystore password and key password in the config file correctly"
    );
  }

  return {
    keyStorePath: path.resolve(R2AConfig.android.keyStore.keystorePath),
    keyStorePassword: process.env.R2A_ANDROID_KEYSTORE_PASSWORD,
    keyAlias: R2AConfig.android.keyStore.keyAlias,
    keyPassword: process.env.R2A_ANDROID_KEY_PASSWORD,
  };
};

export const setAndroidSDKLocation = async (androidRoot: string) => {
  try {
    const sdkPath = `sdk.dir=${homedir()}/Library/Android/sdk`;
    await fs.writeFile(path.join(androidRoot, "local.properties"), sdkPath);
  } catch (error) {
    console.error("Error creating local.properties:", error);
    throw error;
  }
};
