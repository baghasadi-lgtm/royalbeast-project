self.addEventListener('push', (event) => {
  let data = { title: 'Royal Beast', body: '', url: '/admin/orders', tag: 'team-alert' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    data.body = event.data?.text() || data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: data.tag || 'team-alert',
      data: { url: data.url || '/admin/orders' },
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(target) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(target);
      }
    })
  );
});
