// task.service.js — Core task business logic

const prisma = require('../config/prisma');

const { queueTaskAssignedEmail, queueCommentEmail } = require('../config/emailQueue');

// Helper to verify user has access to project
const verifyProjectAccess = async (userId, projectId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { workspace: { include: { members: true } } }
    });
    if (!project) throw new Error('Project not found');

    const isMember = project.workspace.members.some(m => m.userId === userId);
    if (!isMember) throw new Error('Access denied');

    return project;
};

const createTask = async (userId, projectId, data) => {
    const status = data.status ?? 'TODO';

    return await prisma.$transaction(async (tx) => {
        // 1. Access check (keep inside transaction if it depends on DB state)
        await verifyProjectAccess(userId, projectId);

        // 2. Get next position safely
        const { _max } = await tx.task.aggregate({
            where: { projectId, status },
            _max: { position: true }
        });

        const position = (_max.position ?? -1) + 1;

        // 3. Create task
        const task = await tx.task.create({
            data: {
                ...data,
                status,
                position,
                projectId,
                creatorId: userId
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                creator: { select: { id: true, name: true } },
                labels: { include: { label: true } },
                subtasks: true,
                _count: { select: { comments: true } }
            }
        });

        // If task was assigned to someone, send them an email notification
        if (data.assigneeId && data.assigneeId !== userId) {
            const assignee = await prisma.user.findUnique({
                where: { id: data.assigneeId },
                select: { email: true, name: true }
            });
            const creator = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });
            if (assignee) {
                await queueTaskAssignedEmail(
                    assignee.email,
                    assignee.name,
                    data.title,
                    'Your Project', // We'll make this dynamic later
                    creator.name
                );
            }
        }

        return task;
    });
};

const getTasksByProject = async (userId, projectId, filters = {}) => {
    await verifyProjectAccess(userId, projectId);

    // Build where clause dynamically from filters
    const where = {
        projectId,
        parentId: null,  // top-level tasks only
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    };

    return await prisma.task.findMany({
        where,
        include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true } },
            labels: { include: { label: true } },
            subtasks: { include: { assignee: { select: { id: true, name: true } } } },
            _count: { select: { comments: true } }
        },
        orderBy: [{ status: 'asc' }, { position: 'asc' }]
    });
};

const getTaskById = async (userId, taskId) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true } },
            labels: { include: { label: true } },
            subtasks: true,
            comments: {
                include: { author: { select: { id: true, name: true, avatar: true } } },
                orderBy: { createdAt: 'asc' }
            }
        }
    });
    if (!task) throw new Error('Task not found');
    await verifyProjectAccess(userId, task.projectId);
    return task;
};

const updateTask = async (userId, taskId, data) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Get task (only fields we actually need)
        const task = await tx.task.findUnique({
            where: { id: taskId },
            select: { id: true, projectId: true }
        });

        if (!task) throw new Error('Task not found');

        // 2. Access control
        await verifyProjectAccess(userId, task.projectId);

        // 3. Update task
        const updatedTask = await tx.task.update({
            where: { id: taskId },
            data,
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                labels: { include: { label: true } },
                subtasks: true
            }
        });

        return updatedTask;
    });
};
// Drag & drop — update task status and position
const moveTask = async (userId, taskId, { status, position }) => {
    return await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
            where: { id: taskId },
            select: { id: true, projectId: true, status: true, position: true }
        });

        if (!task) throw new Error('Task not found');

        await verifyProjectAccess(userId, task.projectId);

        const sameColumn = task.status === status;

        if (sameColumn) {
            // Shift tasks within same column
            if (position > task.position) {
                await tx.task.updateMany({
                    where: {
                        projectId: task.projectId,
                        status,
                        position: { gt: task.position, lte: position }
                    },
                    data: { position: { decrement: 1 } }
                });
            } else {
                await tx.task.updateMany({
                    where: {
                        projectId: task.projectId,
                        status,
                        position: { gte: position, lt: task.position }
                    },
                    data: { position: { increment: 1 } }
                });
            }
        } else {
            // Remove from old column
            await tx.task.updateMany({
                where: {
                    projectId: task.projectId,
                    status: task.status,
                    position: { gt: task.position }
                },
                data: { position: { decrement: 1 } }
            });

            // Make space in new column
            await tx.task.updateMany({
                where: {
                    projectId: task.projectId,
                    status,
                    position: { gte: position }
                },
                data: { position: { increment: 1 } }
            });
        }

        return await tx.task.update({
            where: { id: taskId },
            data: { status, position }
        });
    });
};

const deleteTask = async (userId, taskId) => {
    return await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
            where: { id: taskId },
            select: { id: true, projectId: true, status: true, position: true }
        });

        if (!task) throw new Error('Task not found');

        await verifyProjectAccess(userId, task.projectId);

        await tx.task.delete({ where: { id: taskId } });

        // Close the gap
        await tx.task.updateMany({
            where: {
                projectId: task.projectId,
                status: task.status,
                position: { gt: task.position }
            },
            data: { position: { decrement: 1 } }
        });

        return { message: 'Task deleted' };
    });
};
// Add label to task
const addLabel = async (userId, taskId, labelId) => {
    return await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
            where: { id: taskId },
            select: { projectId: true }
        });

        if (!task) throw new Error('Task not found');

        await verifyProjectAccess(userId, task.projectId);

        return await tx.taskLabel.upsert({
            where: { taskId_labelId: { taskId, labelId } },
            update: {},
            create: { taskId, labelId }
        });
    });
};

// Add comment to task
const addComment = async (userId, taskId, content) => {
    return await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
            where: { id: taskId },
            select: { projectId: true }
        });

        if (!task) throw new Error('Task not found');

        await verifyProjectAccess(userId, task.projectId);
        // Notify task creator about new comment (if commenter is different person)
        if (task.creatorId !== userId) {
            const creator = await prisma.user.findUnique({
                where: { id: task.creatorId },
                select: { email: true, name: true }
            });
            const commenter = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });
            if (creator) {
                await queueCommentEmail(
                    creator.email,
                    creator.name,
                    task.title,
                    commenter.name,
                    content
                );
            }
        }
        return await tx.comment.create({
            data: { content, taskId, authorId: userId },
            include: {
                author: { select: { id: true, name: true, avatar: true } }
            }
        });
    });
};

const removeLabel = async (userId, taskId, labelId) => {
    return await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
            where: { id: taskId },
            select: { projectId: true }
        });
        if (!task) throw new Error('Task not found');

        await verifyProjectAccess(userId, task.projectId);

        await tx.taskLabel.delete({
            where: { taskId_labelId: { taskId, labelId } }
        });

        return { message: 'Label removed from task' };
    });
};
module.exports = {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    moveTask,
    deleteTask,
    addLabel,
    removeLabel,
    addComment
};