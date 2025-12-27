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

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png', 
            image: 'https://img.freepik.com/free-vector/task-management-abstract-concept-vector-illustration_335657-1679.jpg', 
            badge: '/logo192.png',
            actions: [
                { action: 'view', title: '👁️ عرض المهمة' },
                { action: 'close', title: '✖️ إغلاق' }
            ],
            data: {
                url: data.url || '/tasks'
            },
            vibrate: [200, 100, 200],
            // ✅ تعديل الـ tag ليكون فريداً لكل إشعار باستخدام الوقت الحالي
            // هذا يضمن أن الإشعارات الجديدة تظهر دائماً حتى لو المتصفح مغلق
            tag: 'task-' + Date.now(), 
            
            // ✅ هذه الإضافة تجعل الإشعار لا يختفي تلقائياً بل ينتظرك لتفتحه
            requireInteraction: true, 
            
            renotify: true 
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});