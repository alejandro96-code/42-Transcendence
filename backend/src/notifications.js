const pendingNotifications = new Map();

export function addNotification(userId, notification) {
    const notifications = pendingNotifications.get(userId) || [];

    notifications.push(notification);
    pendingNotifications.set(userId, notifications);
}

export function getNotifications(userId) {
    const notifications = pendingNotifications.get(userId) || [];

    pendingNotifications.delete(userId);

    return notifications;
}