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

// الاستماع لحدث الضغط على الإشعار
self.addEventListener('notificationclick', function (event) {
    event.notification.close(); // إغلاق الإشعار
    
    event.waitUntil(
        // فتح الرابط المرفق مع الإشعار في تبويب جديد
        // eslint-disable-next-line no-undef
        clients.openWindow(event.notification.data.url)
    );
});