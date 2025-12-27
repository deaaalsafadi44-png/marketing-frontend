// الاستماع لحدث الضغط على الإشعار
self.addEventListener('notificationclick', function (event) {
    event.notification.close(); // إغلاق الإشعار

    // الرابط القادم من السيرفر (مثل: /tasks/view/1765793542)
    const targetUrl = event.notification.data.url || '/tasks';

    event.waitUntil(
        // البحث عن جميع التبويبات المفتوحة للموقع
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // 1. إذا كان الموقع مفتوحاً في أي تبويب، قم بتغيير الرابط في التبويب نفسه
            for (let client of clientList) {
                if (client.url.includes(self.location.origin) && 'navigate' in client) {
                    return client.navigate(targetUrl).then(c => c.focus());
                }
            }

            // 2. إذا كان الموقع مغلقاً تماماً، عندها فقط افتح نافذة جديدة
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});