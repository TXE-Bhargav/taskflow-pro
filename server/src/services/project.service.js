// project.service.js — Project business logic

const prisma = require('../config/prisma');

// Helper — verify user is a workspace member
const verifyMembership = async (userId, workspaceId) => {
    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!member) throw new Error('Access denied');
    return member;
};

const createProject = async (userId, workspaceId, { name, description, color }) => {
    await verifyMembership(userId, workspaceId);

    const project = await prisma.project.create({
        data: { name, description, color, workspaceId }
    });
    return project;
};

const getProjects = async (userId, workspaceId) => {
    await verifyMembership(userId, workspaceId);

    return await prisma.project.findMany({
        where: { workspaceId },
        include: {
            _count: { select: { tasks: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

const getProjectById = async (userId, projectId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { labels: true }
    });
    if (!project) throw new Error('Project not found');

    await verifyMembership(userId, project.workspaceId);
    return project;
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

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };