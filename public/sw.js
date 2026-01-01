/* eslint-disable no-restricted-globals */

// 1. الاستماع لحدث وصول الإشعار من السيرفر
self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            
            // ✅ الإصلاح الأول: استخراج الرابط بشكل صحيح بناءً على كود الباك إند المعدل
            // الباك إند يرسل الرابط داخل data.url، لذا نضمن وصوله هنا
            const targetUrl = (data.data && data.data.url) ? data.data.url : (data.url || '/tasks');

            const options = {
                body: data.body,
                icon: '/logo192.png', 
                badge: '/logo192.png',
                image: 'https://img.freepik.com/free-vector/task-management-abstract-concept-vector-illustration_335657-1679.jpg',
                
                actions: [
                    { action: 'view', title: '👁️ عرض المهمة' },
                    { action: 'close', title: '✖️ إغلاق' }
                ],
                
                data: {
                    url: targetUrl
                },
                vibrate: [200, 100, 200],

                // ✅ الإصلاح الثاني (الأهم): منع التكرار
                // بدلاً من Date.now() الذي يجعل كل إشعار فريداً ويسبب التكرار،
                // نستخدم تات ثابت لكل مهمة لدمج الإشعارات المكررة.
                tag: 'task-notification-' + targetUrl, 

                requireInteraction: true,  
                renotify: true 
            };

            event.waitUntil(
                self.registration.showNotification(data.title, options)
            );
        } catch (error) {
            console.error("Push Event Error:", error);
        }
    }
});

// 2. الاستماع لحدث الضغط على الإشعار أو الأزرار
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const targetUrl = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // ✅ ذكاء التنقل: إذا كان الموقع مفتوحاً، حدثه وافتحه، وإلا افتح نافذة جديدة
            for (let client of clientList) {
                if (client.url.includes(self.location.origin) && 'navigate' in client) {
                    return client.navigate(targetUrl).then(c => c.focus());
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});