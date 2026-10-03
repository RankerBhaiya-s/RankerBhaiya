self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Ranker Bhaiya";

  const options = {
    body: data.body || "Aaj ki preparation complete karo.",
    icon: "/RankerBhaiya/favicon.png",
    badge: "/RankerBhaiya/favicon.png",
    data: {
      url: data.url || "/RankerBhaiya/student/dashboard",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification?.data?.url ||
    "/RankerBhaiya/student/dashboard";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return undefined;
    })
  );
});
