import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';
import './Notifications.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  /* ==================================================
      منطق جلب البيانات وتحديثها (لم يتم تغييره)
  ================================================== */
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

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("فشل تحديث حالة الإشعار", err);
    }
  };

  /* ==================================================
      واجهة العرض المحدثة (تصميم طولي عريض)
  ================================================== */
  return (
    <div className="notifications-container">
      <h2><span>🔔</span> مركز الإشعارات</h2>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">
          لا توجد تنبيهات جديدة في الوقت الحالي
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
              
              {/* القسم الأيمن: العنوان والوصف */}
              <div className="notif-content-wrapper">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>

              {/* القسم الأيسر: الوقت وزر التفاعل */}
              <div className="notif-side-actions">
                <small>
                  🕒 {new Date(n.createdAt).toLocaleString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </small>

                {!n.isRead && (
                  <button className="mark-read-btn" onClick={() => handleMarkAsRead(n._id)}>
                    تمت القراءة
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;