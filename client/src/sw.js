import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly());

registerRoute(
  ({ request }) => ["style", "script", "worker", "image", "font"].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: "static-assets" })
);

async function setBadge(count) {
  if (self.registration && "setAppBadge" in self.registration) {
    await self.registration.setAppBadge(count);
  }
}

async function clearBadge() {
  if (self.registration && "clearAppBadge" in self.registration) {
    await self.registration.clearAppBadge();
  }
}

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() || {};
  const title = payload.title || "CSE 61 D Schedule";
  const unreadCount = Number(payload.unreadCount || 0);
  const options = {
    body: payload.body || "A schedule update is available.",
    icon: "/icons/icon-192.svg",
    badge: "/icons/maskable-icon-512.svg",
    tag: payload.eventId ? `cse61d-${payload.type}-${payload.eventId}` : `cse61d-${payload.type || "update"}`,
    data: {
      url: payload.url || "/",
      eventId: payload.eventId || "",
      type: payload.type || "update"
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      unreadCount > 0 ? setBadge(unreadCount).catch(() => {}) : Promise.resolve()
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url === targetUrl || client.url.startsWith(targetUrl));
      if (matchingClient) return matchingClient.focus();
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_CSE61D_NOTIFICATIONS") return;
  event.waitUntil(
    Promise.all([
      clearBadge().catch(() => {}),
      self.registration.getNotifications().then((notifications) => {
        notifications
          .filter((notification) => notification.tag?.startsWith("cse61d-"))
          .forEach((notification) => notification.close());
      })
    ])
  );
});
