
import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return bytes;
}

export async function registerPushNotifications(userId: string) {
  if (!userId) {
    throw new Error("Please log in before enabling reminders.");
  }

  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VITE_VAPID_PUBLIC_KEY is not configured.");
  }

  if (!window.isSecureContext) {
    throw new Error("Push notifications require HTTPS.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked in browser settings."
        : "Notification permission was not granted.",
    );
  }

  const registration = await navigator.serviceWorker.register(
    "/RankerBhaiya/sw.js",
    { scope: "/RankerBhaiya/" },
  );

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("The browser returned an incomplete push subscription.");
  }

  const { error } = await supabase
    .from("study_push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        subscription: json,
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    throw error;
  }

  return subscription;
}

export async function removePushSubscription(userId: string) {
  if (!userId) return;

  if ("serviceWorker" in navigator) {
    try {
      const registration =
        await navigator.serviceWorker.getRegistration("/RankerBhaiya/");

      const subscription =
        await registration?.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        const { error } = await supabase
          .from("study_push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", endpoint);

        if (error) throw error;

        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error("Could not remove push subscription:", error);
      throw error;
    }
  }
}
