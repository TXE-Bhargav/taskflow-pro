const prisma = require('../config/prisma');

// ─── CREATE WORKSPACE ───────────────────────────────────────────────
const createWorkspace = async (userId, { name, description }) => {
    const workspace = await prisma.workspace.create({
        data: {
            name,
            description,
            ownerId: userId,
            members: {
                create: {
                    userId,
                    role: 'OWNER'
                }
            }
        },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } } }
            }
        }
    });
    return workspace;
};

// Get all workspaces a user belongs to
const getUserWorkspaces = async (userId) => {
    const workspace = await prisma.workspace.findMany({
        where: {
            members: {
                some: { userId }
            }
        },
        include: {
            _count: { select: { projects: true, members: true } },
            owner: { select: { id: true, name: true } }
        }
    });

    return workspace;
}

// Get single workspace with full details
const getWorkspaceById = async (workspaceId, userId) => {

    const member = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId
            }
        }
    });

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
    include: {
      projects: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      }
    }
  });
  return workspace;
}

const inviteMember = async (workspaceId, inviterId, email, role = 'MEMBER') => {

  // Check inviter has permission (must be OWNER or ADMIN)
  const inviter = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: inviterId, workspaceId } }
  });
  if (!inviter || inviter.role === 'MEMBER') {
    throw new Error('Only owners and admins can invite members');
  }

  // Find the user being invited
  const userToInvite = await prisma.user.findUnique({ where: { email } });
  if (!userToInvite) throw new Error('No user found with that email');

  // Check not already a member
  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: userToInvite.id, workspaceId } }
  });
  if (existing) throw new Error('User is already a member');

  const member = await prisma.workspaceMember.create({
    data: { userId: userToInvite.id, workspaceId, role },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
  return member;
};

module.exports = { createWorkspace, getUserWorkspaces, getWorkspaceById, inviteMember };