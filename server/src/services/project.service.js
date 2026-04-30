const prisma = require('../config/prisma');

// ── Verify workspace membership ──
const verifyMembership = async (userId, workspaceId) => {
    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!member) throw new Error('Access denied');
    return member;
};

// ── Verify project membership ──
const verifyProjectMembership = async (userId, projectId) => {
    const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } }
    });
    if (!member) throw new Error('Access denied to this project');
    return member;
};

// ── Create project — creator auto-added as OWNER ──
const createProject = async (userId, workspaceId, { name, description, color }) => {
    await verifyMembership(userId, workspaceId);

    const project = await prisma.project.create({
        data: {
            name,
            description,
            color,
            workspaceId,
            members: {
                create: { userId, role: 'OWNER' }
            }
        },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } } }
            }
        }
    });
    return project;
};

// ── Get projects user is a member of ──
const getProjects = async (userId, workspaceId) => {
    await verifyMembership(userId, workspaceId);

    // Get workspace member role — owners/admins see all projects
    const wsMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });

    const isAdmin = wsMember?.role === 'OWNER' || wsMember?.role === 'ADMIN';

    const projects = await prisma.project.findMany({
        where: {
            workspaceId,
            // Regular members only see projects they're in
            ...(isAdmin ? {} : {
                projectMembers: { some: { userId } }
            })
        },
        include: {
            _count: { select: { tasks: true, projectMembers: true } },
            projectMembers: {
                include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
            },
            tasks: {
                where: { parentId: null },
                select: { status: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return projects.map(p => {
        const total = p.tasks.length;
        const done = p.tasks.filter(t => t.status === 'DONE').length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...p, progress, totalTasks: total, doneTasks: done };
    });
};

// ── Get single project ──
const getProjectById = async (userId, projectId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            labels: true,
            members: {
                include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
            }
        }
    });
    if (!project) throw new Error('Project not found');

    // Check workspace membership first
    await verifyMembership(userId, project.workspaceId);

    // Then check project membership (admins bypass)
    const wsMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: project.workspaceId } }
    });
    const isAdmin = wsMember?.role === 'OWNER' || wsMember?.role === 'ADMIN';

    if (!isAdmin) {
        await verifyProjectMembership(userId, projectId);
    }

    return project;
};

// ── Get project members ──
const getProjectMembers = async (userId, projectId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) throw new Error('Project not found');

    await verifyMembership(userId, project.workspaceId);

    return await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { joinedAt: 'asc' }
    });
};

// ── Invite user to project ──
const inviteToProject = async (inviterId, projectId, email) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) throw new Error('Project not found');

    // Inviter must be workspace admin or project owner
    const wsMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: inviterId, workspaceId: project.workspaceId } }
    });
    const projMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: inviterId, projectId } }
    });

    const canInvite = wsMember?.role === 'OWNER' ||
        wsMember?.role === 'ADMIN' ||
        projMember?.role === 'OWNER';

    if (!canInvite) throw new Error('Only project owners and workspace admins can invite');

    // Find user by email — must already be workspace member
    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) throw new Error('No user found with that email');

    const isWorkspaceMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: userToInvite.id, workspaceId: project.workspaceId } }
    });
    if (!isWorkspaceMember) {
        throw new Error('User must be a workspace member first. Invite them to the workspace first.');
    }

    // Check not already in project
    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: userToInvite.id, projectId } }
    });
    if (existing) throw new Error('User is already a project member');

    return await prisma.projectMember.create({
        data: { userId: userToInvite.id, projectId, role: 'MEMBER' },
        include: { user: { select: { id: true, name: true, email: true } } }
    });
};

// ── Remove member from project ──
const removeMemberFromProject = async (requesterId, projectId, targetUserId) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const requester = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: requesterId, projectId } }
    });
    if (!requester || requester.role !== 'OWNER') {
        throw new Error('Only project owner can remove members');
    }

    const target = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: targetUserId, projectId } }
    });
    if (!target) throw new Error('Member not found');
    if (target.role === 'OWNER') throw new Error('Cannot remove project owner');

    await prisma.projectMember.delete({
        where: { userId_projectId: { userId: targetUserId, projectId } }
    });

    return { message: 'Member removed from project' };
};

const updateProject = async (userId, projectId, data) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const member = await verifyMembership(userId, project.workspaceId);
    if (member.role === 'MEMBER') throw new Error('Only admins and owners can update projects');

    return await prisma.project.update({ where: { id: projectId }, data });
};

const deleteProject = async (userId, projectId) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const member = await verifyMembership(userId, project.workspaceId);
    if (member.role === 'MEMBER') throw new Error('Only admins and owners can delete projects');

    await prisma.project.delete({ where: { id: projectId } });
    return { message: 'Project deleted' };
};

const archiveProject = async (userId, projectId) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const member = await verifyMembership(userId, project.workspaceId);
    if (member.role === 'MEMBER') throw new Error('Only admins and owners can archive projects');

    const newStatus = project.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    return await prisma.project.update({
        where: { id: projectId },
        data: { status: newStatus }
    });
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    getProjectMembers,
    inviteToProject,
    removeMemberFromProject,
    updateProject,
    deleteProject,
    archiveProject
};