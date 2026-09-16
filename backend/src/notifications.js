const pendingNotifications = new Map();
const profileViewers = new Map();

export function addNotification(userId, notification) {
    const notifications = pendingNotifications.get(userId) || [];

    notifications.push(notification);
    pendingNotifications.set(userId, notifications);
}

export function watchProfile(profileUserId, viewerUserId) {
    const viewers = profileViewers.get(profileUserId) || new Set();
    viewers.add(viewerUserId);
    profileViewers.set(profileUserId, viewers);
}

export function unwatchProfile(profileUserId, viewerUserId) {
    const viewers = profileViewers.get(profileUserId);

    if (!viewers) {
        return;
    }

    viewers.delete(viewerUserId);

    if (viewers.size === 0) {
        profileViewers.delete(profileUserId);
    }
}

export function getProfileViewers(profileUserId) {
    return profileViewers.get(profileUserId) || new Set();
}

export function getNotifications(userId) {
    const notifications = pendingNotifications.get(userId) || [];

    pendingNotifications.delete(userId);

    return notifications;
}