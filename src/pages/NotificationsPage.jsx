import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/apiClient';
import './Notifications.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  /* ==================================================
      منطق جلب البيانات
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

  /* ==================================================
      تحديث حالة الإشعار إلى "مقروء"
  ================================================== */
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation(); 
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("فشل تحديث حالة الإشعار", err);
    }
  };

  /* ==================================================
      دالة حذف الإشعار
  ================================================== */
  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation(); // منع الانتقال لصفحة التاسك عند الضغط على الحذف
    if (window.confirm("هل أنت متأكد من حذف هذا الإشعار؟")) {
      try {
        await api.delete(`/api/notifications/${id}`);
        // تحديث القائمة محلياً بعد الحذف الناجح
        setNotifications(notifications.filter(n => n._id !== id));
      } catch (err) {
        console.error("فشل حذف الإشعار", err);
      }
    }
  };

  /* ==================================================
      دالة الانتقال
  ================================================== */
  const handleNotificationClick = (url) => {
    if (url) {
      navigate(url);
    }
  };

  return (
    <div className="notifications-container">
      
      <div className="notif-header">
        <div className="header-right">
          <button className="back-icon-btn" onClick={() => navigate(-1)} title="رجوع">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h2>مركز الإشعارات</h2>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">لا توجد تنبيهات جديدة حالياً</div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div 
              key={n._id} 
              className={`notification-item ${n.isRead ? 'read' : 'unread'} clickable`}
              onClick={() => handleNotificationClick(n.url)}
            >
              {/* زر الحذف في الزاوية */}
              <button 
                className="delete-notif-btn" 
                onClick={(e) => handleDeleteNotification(n._id, e)}
                title="حذف الإشعار"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="notif-content-wrapper">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>

              <div className="notif-side-actions">
                <small>
                  🕒 {new Date(n.createdAt).toLocaleString('ar-EG', { 
                    hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' 
                  })}
                </small>

                {!n.isRead && (
                  <button className="mark-read-btn" onClick={(e) => handleMarkAsRead(n._id, e)}>
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