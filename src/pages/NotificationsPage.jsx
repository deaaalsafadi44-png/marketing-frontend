import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';
import './Notifications.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

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
      console.error(err);
    }
  };

  return (
    <div className="notifications-container">
      <h2>الإشعارات 🔔</h2>
      {notifications.length === 0 ? (
        <p>لا توجد إشعارات حالياً</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
              <div className="notif-content">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
              {!n.isRead && (
                <button onClick={() => handleMarkAsRead(n._id)}>تحديد كمقروء</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;