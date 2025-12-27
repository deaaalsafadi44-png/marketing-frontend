// دالة لتحويل مفتاح الـ Public VAPID Key لتنسيق يفهمه المتصفح
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeUserToPush = async (api) => {
    try {
        // 1. التأكد من دعم المتصفح للـ Service Worker
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;

        // 2. طلب الإذن من المستخدم
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // 3. الاشتراك في خدمة Push الخاصة بالمتصفح
        // ⚠️ استبدل المفتاح أدناه بـ Public Key الخاص بك
        const publicVapidKey = "BEIC0vTH14R-5ImDKrMul0ss7Ci2cOfMfN2O0UxDkmyIpCCRkFRwAP4kQr55KOt7vHxA73fSBHpjmcTAuU33zP8";
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // 4. إرسال الاشتراك للباك إند لحفظه
        await api.post("/auth/subscribe", { subscription });
        console.log("Push Notification Subscribed ✅");

    } catch (err) {
        console.error("Failed to subscribe to push", err);
    }
};