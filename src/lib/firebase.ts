import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAI,
  GoogleAIBackend,
  type AI,
} from "firebase/ai";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import {
  getRemoteConfig,
  fetchAndActivate,
  getString,
  type RemoteConfig,
} from "firebase/remote-config";
import type { ChromeNanoStatus, DeviceCapabilities } from "../types/hybrid";

export const DEFAULT_CLOUD_MODEL =
  import.meta.env.VITE_CLOUD_MODEL || "gemini-3.5-flash-lite";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let appInstance: FirebaseApp | null = null;
let aiInstance: AI | null = null;
let appCheckInstance: AppCheck | null = null;
let remoteConfigInstance: RemoteConfig | null = null;
let resolvedCloudModel = DEFAULT_CLOUD_MODEL;

export function initFirebaseServices(): {
  app: FirebaseApp | null;
  ai: AI | null;
  appCheckActive: boolean;
} {
  if (!isFirebaseConfigured()) {
    return { app: null, ai: null, appCheckActive: false };
  }

  if (!appInstance) {
    appInstance =
      getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }

  if (!appCheckInstance && typeof window !== "undefined") {
    const recaptchaKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
    const isDev = import.meta.env.DEV;

    if (isDev && typeof self !== "undefined") {
      // Load debug token dynamically from gitignored .env.local, or auto-generate in console
      const envDebugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
      (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
        envDebugToken || true;
    }

    if (recaptchaKey) {
      try {
        appCheckInstance = initializeAppCheck(appInstance, {
          provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn("App Check initialization skipped:", err);
      }
    }
  }

  if (!aiInstance) {
    aiInstance = getAI(appInstance, {
      backend: new GoogleAIBackend(),
      useLimitedUseAppCheckTokens: Boolean(appCheckInstance),
    });
  }

  return {
    app: appInstance,
    ai: aiInstance,
    appCheckActive: Boolean(appCheckInstance),
  };
}

export async function resolveCloudModelFromRemoteConfig(): Promise<string> {
  if (!appInstance) return DEFAULT_CLOUD_MODEL;
  try {
    if (!remoteConfigInstance) {
      remoteConfigInstance = getRemoteConfig(appInstance);
      remoteConfigInstance.settings.minimumFetchIntervalMillis = 300_000;
      remoteConfigInstance.defaultConfig = {
        cloud_model_name: DEFAULT_CLOUD_MODEL,
      };
    }
    await fetchAndActivate(remoteConfigInstance);
    const remoteModel = getString(remoteConfigInstance, "cloud_model_name");
    if (remoteModel && remoteModel.trim().length > 0) {
      resolvedCloudModel = remoteModel.trim();
    }
  } catch {
    // Fall back to default Gemini 3 model if Remote Config is not yet provisioned
  }
  return resolvedCloudModel;
}

export function getActiveCloudModel(): string {
  return resolvedCloudModel;
}

export async function detectChromeNanoStatus(): Promise<ChromeNanoStatus> {
  if (typeof window === "undefined") return "unavailable";

  try {
    // Standard W3C / Chrome 138+ Prompt API
    const globalAny = window as unknown as Record<string, unknown>;
    const lm = globalAny.LanguageModel as
      | { availability?: () => Promise<string> }
      | undefined;

    if (lm && typeof lm.availability === "function") {
      const status = await lm.availability();
      if (status === "available" || status === "readily") return "available";
      if (status === "downloadable" || status === "after-download")
        return "downloadable";
      if (status === "downloading") return "downloading";
    }

    // Legacy window.ai.languageModel check
    const legacyAi = globalAny.ai as
      | { languageModel?: { capabilities?: () => Promise<{ available: string }> } }
      | undefined;
    if (legacyAi?.languageModel?.capabilities) {
      const cap = await legacyAi.languageModel.capabilities();
      if (cap.available === "readily") return "available";
      if (cap.available === "after-download") return "downloadable";
    }
  } catch {
    // Prompt API not enabled in this browser
  }

  return "unavailable";
}

export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  const { appCheckActive } = initFirebaseServices();
  const [chromeNanoStatus, activeCloudModel] = await Promise.all([
    detectChromeNanoStatus(),
    resolveCloudModelFromRemoteConfig(),
  ]);

  return {
    firebaseConfigured: isFirebaseConfigured(),
    appCheckActive,
    chromeNanoStatus,
    activeCloudModel,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}
