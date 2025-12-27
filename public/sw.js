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
            // 1. أيقونة صغيرة تظهر بجانب النص
            icon: '/logo192.png', 
            // 2. صورة كبيرة تظهر أسفل النص (تجذب الانتباه جداً)
            image: 'https://img.freepik.com/free-vector/task-management-abstract-concept-vector-illustration_335657-1679.jpg', 
            // 3. أيقونة تظهر في شريط التنبيهات (للأندرويد خاصة)
            badge: '/logo192.png',
            // 4. إضافة أزرار تفاعلية تحت الإشعار
            actions: [
                { action: 'view', title: '👁️ عرض المهمة' },
                { action: 'close', title: '✖️ إغلاق' }
            ],
            data: {
                url: data.url || '/tasks'
            },
            vibrate: [200, 100, 200], // نمط اهتزاز مميز
            tag: 'task-notification', // لمنع تراكم الإشعارات فوق بعضها
            renotify: true 
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});