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
      // تحديث الحالة محلياً فوراً لتحسين تجربة المستخدم
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("فشل تحديث حالة الإشعار", err);
    }
  };

  return (
    <div className="notifications-container">
      {/* العنوان بشكل عصري مع أيقونة */}
      <h2><span>🔔</span> مركز الإشعارات</h2>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">
          لا توجد تنبيهات جديدة في الوقت الحالي
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
              <div className="notif-content">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                {/* تنسيق الوقت بشكل احترافي مع أيقونة الساعة */}
                <small>
                  🕒 {new Date(n.createdAt).toLocaleString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </small>
              </div>

              {/* زر القراءة بتصميم جديد */}
              {!n.isRead && (
                <button className="mark-read-btn" onClick={() => handleMarkAsRead(n._id)}>
                  تمت القراءة
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