"use client";
// The "🔔 Turn on notifications" row. Uses OneSignal (see README).
// It only appears when notifications can be turned on here and aren't on yet,
// and it only asks for permission when tapped.

import { useEffect, useState } from "react";
import { ONESIGNAL_APP_ID } from "@/lib/config";
import { BellIcon } from "./Icons";

type OneSignalSDK = {
  init(options: Record<string, unknown>): Promise<void>;
  Notifications: { requestPermission(): Promise<void>; permission: boolean };
};
declare global {
  interface Window {
    OneSignalDeferred?: ((sdk: OneSignalSDK) => void)[];
  }
}

let started = false;
function startOneSignal() {
  if (started) return;
  started = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/push/onesignal/" },
      allowLocalhostAsSecureOrigin: true,
    });
  });
  const s = document.createElement("script");
  s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  s.defer = true;
  document.head.appendChild(s);
}

export function NotificationsRow() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ONESIGNAL_APP_ID) return;
    // On iPhone, notifications exist only inside the installed (home-screen) app.
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    startOneSignal();
    setShow(Notification.permission === "default");
  }, []);

  if (!show) return null;
  const turnOn = () => {
    window.OneSignalDeferred?.push(async (OneSignal) => {
      await OneSignal.Notifications.requestPermission();
      setShow(Notification.permission === "default");
    });
  };
  return (
    <div className="rows mt-8">
      <button className="row" onClick={turnOn}>
        <BellIcon />
        <span>Turn on notifications</span>
      </button>
    </div>
  );
}
