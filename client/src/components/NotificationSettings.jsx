import { Bell, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { disablePushNotifications, enablePushNotifications, getPushCapability, isIosLike, isStandaloneApp, loadPushStatus } from "../utils/pwa.js";

function statusText(status) {
  if (status.reason === "ios-install-required") return "Install app first";
  if (status.reason === "unsupported") return "Not supported";
  if (status.reason === "permission-denied") return "Blocked";
  if (status.reason === "server-not-configured") return "Server setup needed";
  return status.enabled ? "Enabled" : "Disabled";
}

export default function NotificationSettings() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ enabled: false, unreadCount: 0, reason: "" });
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    loadPushStatus().then(setStatus).catch(() => setStatus(getPushCapability()));

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function enable() {
    setBusy(true);
    try {
      setStatus(await enablePushNotifications());
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      setStatus(await disablePushNotifications());
    } finally {
      setBusy(false);
    }
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  const capability = getPushCapability();
  const iosNeedsInstall = capability.reason === "ios-install-required";
  const blocked = status.reason === "permission-denied";

  return (
    <div className="relative">
      <button
        type="button"
        className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
        onClick={() => setOpen((current) => !current)}
        title="Notification settings"
      >
        <Bell size={15} />
        <span className="hidden md:inline">Notifications</span>
        {status.unreadCount > 0 && <span className="rounded-full bg-forest px-1.5 text-[10px] font-black text-white">{status.unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-line bg-white p-3 text-sm shadow-soft">
          <div className="font-black text-ink">Notifications</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">{statusText(status)}</div>

          {iosNeedsInstall && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs leading-5 text-amber-900">
              To enable notifications on iPhone, add CSE 61 D Schedule to your Home Screen first.
              <br />
              Safari Share button → Add to Home Screen → open the installed app → Enable Notifications.
            </div>
          )}

          {!iosNeedsInstall && isIosLike() && !isStandaloneApp() && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs leading-5 text-amber-900">
              iOS/iPadOS 16.4+ requires the installed Home Screen app for Web Push.
            </div>
          )}

          {blocked && (
            <div className="mt-3 rounded-lg bg-rose-50 p-2 text-xs leading-5 text-rose-900">
              Notifications are blocked in browser or system settings.
            </div>
          )}

          {installPrompt && (
            <button
              type="button"
              className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-xs font-black"
              onClick={installApp}
            >
              <Download size={14} /> Install App
            </button>
          )}

          <button
            type="button"
            className="focus-ring mt-3 w-full rounded-md bg-ink px-3 py-2 text-xs font-black text-white disabled:opacity-60"
            disabled={busy || iosNeedsInstall || blocked || !capability.supported}
            onClick={status.enabled ? disable : enable}
          >
            {busy ? "Working..." : status.enabled ? "Disable Notifications" : "Enable Notifications"}
          </button>
        </div>
      )}
    </div>
  );
}
