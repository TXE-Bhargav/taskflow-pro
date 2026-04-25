const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(req.user.id, id);
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const markAllAsRead = async (req, res) => {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
module.exports = { getNotifications, markAsRead, markAllAsRead };