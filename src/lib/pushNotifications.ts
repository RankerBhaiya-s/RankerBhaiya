import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding =
    "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 =
    (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0)),
  );
}

export async function registerPushNotifications(
  userId: string,
) {
  if (!userId) {
    throw new Error("User is not logged in.");
  }

  if (typeof window === "undefined") {
    throw new Error("Notifications are unavailable.");
  }

  if (!("Notification" in window)) {
    throw new Error(
      "Notifications are not supported by this browser.",
    );
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service Worker is not supported by this browser.",
    );
  }

  if (!("PushManager" in window)) {
    throw new Error(
      "Push notifications are not supported by this browser.",
    );
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "VAPID public key is missing.",
    );
  }

  /*
   * Ask browser permission
   */

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Please allow notifications from your browser site settings."
        : "Notification permission was not granted.",
    );
  }

  /*
   * Register Service Worker
   *
   * GitHub Pages base:
   * /RankerBhaiya/
   */

  const registration =
    await navigator.serviceWorker.register(
      "/RankerBhaiya/sw.js",
      {
        scope: "/RankerBhaiya/",
      },
    );

  await navigator.serviceWorker.ready;

  /*
   * Check existing subscription
   */

  let subscription =
    await registration.pushManager.getSubscription();

  /*
   * Create new subscription if needed
   */

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY,
          ),
      });
  }

  const json = subscription.toJSON();

  if (
    !json.endpoint ||
    !json.keys?.p256dh ||
    !json.keys?.auth
  ) {
    throw new Error(
      "Invalid push subscription.",
    );
  }

  /*
   * Save subscription in Supabase
   */

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: "user_id,endpoint",
      },
    );

  if (error) {
    throw error;
  }

  return subscription;
}

/*
 * Remove user's push subscription
 */

export async function removePushSubscription(
  userId: string,
) {
  if (!userId) return;

  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  /*
   * Remove subscription from browser
   */

  try {
    const registration =
      await navigator.serviceWorker.getRegistration(
        "/RankerBhaiya/",
      );

    if (registration) {
      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  } catch (error) {
    console.error(
      "Browser push unsubscribe error:",
      error,
    );
  }

  /*
   * Remove subscriptions from Supabase
   */

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
