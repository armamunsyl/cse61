import { api } from "../services/api.js";

const ENDPOINT_STORAGE_KEY = "cse61d_push_endpoint";

export function registerAppServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) {
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    window.caches?.keys?.().then((keys) => {
      keys.filter((key) => key.includes("workbox") || key.includes("static-assets")).forEach((key) => window.caches.delete(key));
    });
    return;
  }
  import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      }
    });
  });
}

export function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export function isIosLike() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function getPushCapability() {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return { supported: false, reason: "unsupported" };
  if (isIosLike() && !isStandaloneApp()) return { supported: false, reason: "ios-install-required" };
  return { supported: true, reason: "" };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function activeSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function getStoredPushEndpoint() {
  const subscription = await activeSubscription().catch(() => null);
  const endpoint = subscription?.endpoint || localStorage.getItem(ENDPOINT_STORAGE_KEY) || "";
  if (subscription?.endpoint) localStorage.setItem(ENDPOINT_STORAGE_KEY, subscription.endpoint);
  return endpoint;
}

async function setBadge(count) {
  if ("setAppBadge" in navigator) {
    await navigator.setAppBadge(count);
  }
}

async function clearBadge() {
  if ("clearAppBadge" in navigator) {
    await navigator.clearAppBadge();
  }
}

function notifyServiceWorkerToClear() {
  if (!navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CSE61D_NOTIFICATIONS" });
}

export async function enablePushNotifications() {
  const capability = getPushCapability();
  if (!capability.supported) return { enabled: false, reason: capability.reason };

  const keyResponse = await api.pushPublicKey();
  if (!keyResponse.configured || !keyResponse.publicKey) {
    return { enabled: false, reason: "server-not-configured" };
  }

  if (Notification.permission === "denied") {
    return { enabled: false, reason: "permission-denied" };
  }

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    return { enabled: false, reason: "permission-denied" };
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(keyResponse.publicKey)
  });

  const response = await api.subscribePush({
    ...subscription.toJSON(),
    userAgent: navigator.userAgent,
    platform: navigator.platform || ""
  });
  localStorage.setItem(ENDPOINT_STORAGE_KEY, subscription.endpoint);
  if (response.unreadCount > 0) await setBadge(response.unreadCount).catch(() => {});
  return { enabled: true, unreadCount: response.unreadCount || 0 };
}

export async function disablePushNotifications() {
  const subscription = await activeSubscription().catch(() => null);
  const endpoint = subscription?.endpoint || localStorage.getItem(ENDPOINT_STORAGE_KEY);
  if (subscription) await subscription.unsubscribe();
  if (endpoint) await api.unsubscribePush(endpoint).catch(() => {});
  localStorage.removeItem(ENDPOINT_STORAGE_KEY);
  await clearBadge().catch(() => {});
  notifyServiceWorkerToClear();
  return { enabled: false, unreadCount: 0 };
}

export async function loadPushStatus() {
  const capability = getPushCapability();
  if (!capability.supported) return { enabled: false, unreadCount: 0, reason: capability.reason };
  const subscription = await activeSubscription().catch(() => null);
  if (!subscription) return { enabled: false, unreadCount: 0, reason: Notification.permission === "denied" ? "permission-denied" : "" };
  localStorage.setItem(ENDPOINT_STORAGE_KEY, subscription.endpoint);
  const status = await api.pushStatus(subscription.endpoint).catch(() => ({ enabled: true, unreadCount: 0 }));
  if (status.unreadCount > 0) await setBadge(status.unreadCount).catch(() => {});
  return status;
}

export async function markNotificationsRead() {
  const endpoint = await getStoredPushEndpoint().catch(() => "");
  if (!endpoint) return;
  await api.markPushRead(endpoint).catch(() => {});
  await clearBadge().catch(() => {});
  notifyServiceWorkerToClear();
}
