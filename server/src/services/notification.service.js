// notification.service.js
// Creates DB notification AND emits real-time socket event simultaneously

const prisma = require('../config/prisma');

// Call this whenever something important happens
const createNotification = async (io, { userId, message, type, link }) => {

  // 1. Save to database — persistent, shows in notification bell
  const notification = await prisma.notification.create({
    data: { userId, message, type, link }
  });

  // 2. Emit real-time event to that specific user
  // We use userId as a personal room — each user auto-joins their own room
  io.to(`user:${userId}`).emit('notification:new', notification);

  return notification;
};

const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20 // Latest 20 notifications
  });
};

const markAsRead = async (userId, notificationId) => {
  return await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
};

const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
  return { message: 'All notifications marked as read' };
};

module.exports = { createNotification, getNotifications, markAsRead, markAllAsRead };