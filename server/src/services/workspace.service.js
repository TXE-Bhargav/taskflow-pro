const prisma = require('../config/prisma');
const { queueTaskAssignedEmail } = require('../config/emailQueue');
const { createNotification } = require('./notification.service');

const createWorkspace = async (userId, { name, description }) => {
    const workspace = await prisma.workspace.create({
        data: {
            name,
            description,
            ownerId: userId,
            members: {
                create: { userId, role: 'OWNER', status: 'ACTIVE' }
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

const getUserWorkspaces = async (userId) => {
    return await prisma.workspace.findMany({
        where: {
            members: { some: { userId, status: 'ACTIVE' } }
        },
        include: {
            _count: { select: { projects: true, members: true } },
            owner: { select: { id: true, name: true } },
            members: { select: { userId: true } }
        }
    });
};

const getWorkspaceById = async (workspaceId, userId) => {
    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!member) throw new Error('Access denied');

    return await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            projects: {
                select: {
                    id: true, name: true, description: true,
                    color: true, status: true,
                    _count: { select: { tasks: true } }
                }
            },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }
        }
    });
};

const updateWorkspace = async (userId, workspaceId, { name, description }) => {
    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!member || member.role === 'MEMBER') {
        throw new Error('Only owners and admins can update workspace');
    }

    return await prisma.workspace.update({
        where: { id: workspaceId },
        data: { name, description }
    });
};

const inviteMember = async (io, workspaceId, inviterId, email, role = 'MEMBER') => {
    const inviter = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: inviterId, workspaceId } }
    });
    if (!inviter || inviter.role === 'MEMBER') {
        throw new Error('Only owners and admins can invite members');
    }

    const inviterUser = await prisma.user.findUnique({
        where: { id: inviterId },
        select: { name: true }
    });

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true }
    });

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) throw new Error('No user found with that email');

    const existing = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: userToInvite.id, workspaceId } }
    });
    if (existing && existing.status === 'ACTIVE') {
        throw new Error('User is already a member');
    }

    // Create or update member record as PENDING
    const member = await prisma.workspaceMember.upsert({
        where: { userId_workspaceId: { userId: userToInvite.id, workspaceId } },
        create: { userId: userToInvite.id, workspaceId, role, status: 'PENDING' },
        update: { role, status: 'PENDING' },
        include: { user: { select: { id: true, name: true, email: true } } }
    });

    // Create in-app notification
    await createNotification(io, {
        userId: userToInvite.id,
        message: `${inviterUser.name} invited you to join "${workspace.name}"`,
        type: 'WORKSPACE_INVITE',
        link: '/dashboard',
        meta: JSON.stringify({ workspaceId, workspaceName: workspace.name })
    });

    // Queue email notification
    // try {
    //     await queueTaskAssignedEmail(
    //         userToInvite.email,
    //         userToInvite.name,
    //         `Join "${workspace.name}" workspace`,
    //         'TaskFlow Pro',
    //         inviterUser.name
    //     );
    // } catch (e) {
    //     console.error('Email queue error:', e.message);
    // }

    return member;
};

const acceptInvite = async (userId, workspaceId) => {
    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });

    if (!member) throw new Error('No invite found');
    if (member.status === 'ACTIVE') throw new Error('Already a member');
    if (member.status === 'DECLINED') throw new Error('Invite was declined');

    return await prisma.workspaceMember.update({
        where: { userId_workspaceId: { userId, workspaceId } },
        data: { status: 'ACTIVE', joinedAt: new Date() }
    });
};

const declineInvite = async (userId, workspaceId) => {
    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });

    if (!member) throw new Error('No invite found');

    // Delete the record completely — they never joined
    await prisma.workspaceMember.delete({
        where: { userId_workspaceId: { userId, workspaceId } }
    });

    return { message: 'Invite declined' };
};

const removeMember = async (workspaceId, requesterId, targetUserId) => {
    const requester = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: requesterId, workspaceId } }
    });
    if (!requester || requester.role === 'MEMBER') {
        throw new Error('Only owners and admins can remove members');
    }

    const target = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: targetUserId, workspaceId } }
    });
    if (!target) throw new Error('Member not found');
    if (target.role === 'OWNER') throw new Error('Cannot remove workspace owner');

    await prisma.workspaceMember.delete({
        where: { userId_workspaceId: { userId: targetUserId, workspaceId } }
    });

    return { message: 'Member removed' };
};

const getPendingInvites = async (userId) => {
    return await prisma.workspaceMember.findMany({
        where: { userId, status: 'PENDING' },
        include: {
            workspace: {
                include: { owner: { select: { name: true } } }
            }
        }
    });
};

module.exports = {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    inviteMember,
    acceptInvite,
    declineInvite,
    removeMember,
    getPendingInvites
};