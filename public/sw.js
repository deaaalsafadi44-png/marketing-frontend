/* eslint-disable no-restricted-globals */

// 1. الاستماع لحدث وصول الإشعار من السيرفر
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png', 
            badge: '/logo192.png',
            image: 'https://img.freepik.com/free-vector/task-management-abstract-concept-vector-illustration_335657-1679.jpg',
            
            // ✅ إضافة الأزرار هنا ضروري جداً ليعرف المتصفح قيمة 'view'
            actions: [
                { action: 'view', title: '👁️ عرض المهمة' },
                { action: 'close', title: '✖️ إغلاق' }
            ],
            
            data: {
                url: data.url || '/tasks' // الرابط الذي سيفتح عند الضغط
            },
            vibrate: [200, 100, 200],
            tag: 'task-' + Date.now(), // وسام فريد لضمان الاستلام والمتصفح مغلق
            requireInteraction: true,  // يبقى ظاهراً حتى يتفاعل معه المستخدم
            renotify: true 
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 2. الاستماع لحدث الضغط على الإشعار أو الأزرار
self.addEventListener('notificationclick', function (event) {
    // إغلاق الإشعار فوراً
    event.notification.close();

    // إذا ضغط المستخدم على زر "إغلاق"، توقف هنا
    if (event.action === 'close') {
        return;
    }

    // تحديد الرابط المستهدف من البيانات المرسلة
    const targetUrl = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // البحث عن تبويب مفتوح للموقع لفتحه (لتجنب صفحة Login)
            for (let client of clientList) {
                if (client.url.includes(self.location.origin) && 'navigate' in client) {
                    return client.navigate(targetUrl).then(c => c.focus());
                }
            }
            // إذا كان المتصفح مغلقاً، افتح نافذة جديدة بالرابط
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});