import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/apiClient';
import './Notifications.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  /* ==================================================
      المنطق البرمجي: جلب البيانات (لم يتغير)
  ================================================== */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        console.log("بيانات الإشعارات الواصلة:", res.data); // للتدقيق
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
    // e.stopPropagation تمنع الانتقال لصفحة التاسك عند الضغط على زر "تمت القراءة" فقط
    e.stopPropagation(); 
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("فشل تحديث حالة الإشعار", err);
    }
  };

  /* ==================================================
      دالة الانتقال لرابط التاسك الموجود في البيانات
  ================================================== */
  const handleNotificationClick = (url) => {
    if (url) {
      navigate(url); // الانتقال للرابط الموجود في حقل url
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
        <div className="no-notifications">
          لا توجد تنبيهات جديدة في الوقت الحالي
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div 
              key={n._id} 
              className={`notification-item ${n.isRead ? 'read' : 'unread'} clickable`}
              onClick={() => handleNotificationClick(n.url)} // استخدام حقل url هنا
            >
              
              <div className="notif-content-wrapper">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>

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
                  <button 
                    className="mark-read-btn" 
                    onClick={(e) => handleMarkAsRead(n._id, e)}
                  >
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