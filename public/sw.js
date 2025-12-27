/* eslint-disable no-restricted-globals */

// الاستماع لحدث وصول الإشعار من السيرفر
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png', // تأكد من وجود أيقونة بهذا الاسم في مجلد public
            badge: '/logo192.png',
            data: {
                url: data.url || '/' // الرابط الذي سيفتح عند الضغط على الإشعار
            },
            vibrate: [100, 50, 100], // نمط الاهتزاز للموبايل
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// الاستماع لحدث الضغط على الإشعار أو الأزرار
self.addEventListener('notificationclick', function (event) {
    // 1. إغلاق الإشعار فور الضغط عليه
    event.notification.close();

    // 2. إذا ضغط المستخدم على زر "إغلاق"، توقف هنا ولا تفتح أي صفحات
    if (event.action === 'close') {
        return;
    }

    // 3. تحديد الرابط الذي سيفتح (الموجود في بيانات الإشعار)
    const targetUrl = event.notification.data.url || '/tasks';

    event.waitUntil(
        // البحث عن تبويب مفتوح للموقع لفتحه بدلاً من نافذة جديدة (لتجنب صفحة Login)
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let client of clientList) {
                // إذا وجد تبويب مفتوح، قم بتوجيهه للرابط المطلوب وركز عليه
                if (client.url.includes(self.location.origin) && 'navigate' in client) {
                    return client.navigate(targetUrl).then(c => c.focus());
                }
            }
            // إذا لم يجد تبويب مفتوح (المتصفح مغلق)، افتح نافذة جديدة بالرابط
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});