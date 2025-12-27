import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';
import './Notifications.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  /* ================================
      جلب الإشعارات من السيرفر
  ================================ */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error("خطأ في جلب الإشعارات", err);
      }
    };
    fetchNotifications();
  }, []);

  /* ================================
      تحديث حالة الإشعار إلى "مقروء"
  ================================ */
  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      // تحديث القائمة محلياً لتغيير التصميم فوراً
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("فشل تحديث حالة الإشعار", err);
    }
  };

  return (
    <div className="notifications-container">
      <h2>الإشعارات 🔔</h2>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">لا توجد إشعارات حالياً</div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            /* التعديل المضاف هنا: إضافة كلاس unread/read للتحكم في الألوان من CSS */
            <div key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
              <div className="notif-content">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                {/* التعديل المضاف هنا: تنسيق الوقت باللغة العربية */}
                <small>{new Date(n.createdAt).toLocaleString('ar-EG')}</small>
              </div>

              {/* التعديل المضاف هنا: إضافة كلاس mark-read-btn للزر */}
              {!n.isRead && (
                <button className="mark-read-btn" onClick={() => handleMarkAsRead(n._id)}>
                  تحديد كمقروء
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;