const prisma = require('../config/prisma');

const updateUserName = async (userId, name) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true, email: true }
  });
};

const getUserProfile = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true }
  });
};

module.exports = {
  updateUserName,
  getUserProfile
};