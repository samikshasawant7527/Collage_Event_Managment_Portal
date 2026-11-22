
import { useState, useEffect } from "react";
import axios from "axios";

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    const fetchNotifications = async () => {
        if (!token) return;

        try {
            const response = await axios.get(
                "http://localhost:5000/api/notifications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications(response.data);
        } catch (error) {
            console.error("Unable to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);

        if (!isOpen) {
            setLoading(true);
            fetchNotifications().finally(() => setLoading(false));
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.put(
                `http://localhost:5000/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
        } catch (error) {
            console.error("Unable to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(
                "http://localhost:5000/api/notifications/read-all",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true
                }))
            );
        } catch (error) {
            console.error("Unable to mark all as read:", error);
        }
    };

    return (
        <div className="notification-bell-container">
            <button
                type="button"
                className="notification-bell-button"
                onClick={handleOpen}
                aria-label="Notifications"
            >
                🔔

                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <h3>Notifications</h3>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <p className="notification-empty">
                                Loading notifications...
                            </p>
                        ) : notifications.length === 0 ? (
                            <p className="notification-empty">
                                You're all caught up! 🎉
                            </p>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${notification.isRead ? "read" : "unread"
                                        }`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsRead(notification._id);
                                        }
                                    }}
                                >
                                    <div className="notification-item-content">
                                        <strong>{notification.title}</strong>

                                        <p>{notification.message}</p>

                                        <small>
                                            {new Date(
                                                notification.createdAt
                                            ).toLocaleString("en-IN")}
                                        </small>
                                    </div>

                                    {!notification.isRead && (
                                        <span className="notification-unread-dot" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
