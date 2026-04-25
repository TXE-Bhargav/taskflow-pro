// analytics.service.js — All dashboard data queries
// This file teaches you the most advanced PostgreSQL of the project
// Every function is a real-world analytics query pattern

const prisma = require('../config/prisma');

// ─── 1. WORKSPACE OVERVIEW ────────────────────────────────────
// High level numbers shown at top of dashboard as stat cards
const getWorkspaceOverview = async (workspaceId, userId) => {

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  if (!member) throw new Error('Access denied');

  // Run all queries in parallel using Promise.all
  // This is much faster than running them one by one
  const [
    totalTasks,
    completedTasks,
    overdueTasks,
    totalMembers,
    totalProjects
  ] = await Promise.all([

    // Total tasks across all projects in workspace
    prisma.task.count({
      where: {
        project: { workspaceId },
        parentId: null // Only top-level tasks
      }
    }),

    // Completed tasks
    prisma.task.count({
      where: {
        project: { workspaceId },
        status: 'DONE',
        parentId: null
      }
    }),

    // Overdue = past due date and NOT done
    prisma.task.count({
      where: {
        project: { workspaceId },
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }, // lt = less than = before today
        parentId: null
      }
    }),

    // Total workspace members
    prisma.workspaceMember.count({ where: { workspaceId } }),

    // Total projects
    prisma.project.count({ where: { workspaceId } })
  ]);

  // Calculate completion rate as percentage
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Productivity score — simple formula, you can make it complex later
  // Based on completion rate minus overdue penalty
  const overduePenalty = totalTasks > 0
    ? Math.round((overdueTasks / totalTasks) * 20)
    : 0;
  const productivityScore = Math.max(0, completionRate - overduePenalty);

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    totalMembers,
    totalProjects,
    completionRate,
    productivityScore
  };
};

// ─── 2. TASKS COMPLETED PER DAY (Last 7 days) ─────────────────
// Powers the line chart — shows daily productivity trend
const getTasksCompletedByDay = async (workspaceId, userId) => {

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  if (!member) throw new Error('Access denied');

  // Go back 7 days from today
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // RAW SQL — Prisma can't do DATE_TRUNC natively
  // DATE_TRUNC('day', ...) rounds timestamp to just the date part
  // This groups all tasks completed on same day together
  const result = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', t."updatedAt") AS date,
      COUNT(*)::int AS count
    FROM "Task" t
    JOIN "Project" p ON t."projectId" = p.id
    WHERE 
      p."workspaceId" = ${workspaceId}
      AND t.status = 'DONE'
      AND t."updatedAt" >= ${sevenDaysAgo}
      AND t."parentId" IS NULL
    GROUP BY DATE_TRUNC('day', t."updatedAt")
    ORDER BY date ASC
  `;

  // Fill in missing days with 0 so chart has no gaps
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const found = result.find(r =>
      r.date.toISOString().split('T')[0] === dateStr
    );

    days.push({
      date: dateStr,
      count: found ? found.count : 0,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }) // "Mon", "Tue"
    });
  }

  return days;
};

// ─── 3. TASKS BY STATUS ───────────────────────────────────────
// Powers the pie chart — distribution across kanban columns
const getTasksByStatus = async (workspaceId, userId) => {

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  if (!member) throw new Error('Access denied');

  // GROUP BY status — counts tasks in each column
  const result = await prisma.$queryRaw`
    SELECT 
      t.status,
      COUNT(*)::int AS count
    FROM "Task" t
    JOIN "Project" p ON t."projectId" = p.id
    WHERE 
      p."workspaceId" = ${workspaceId}
      AND t."parentId" IS NULL
    GROUP BY t.status
    ORDER BY count DESC
  `;

  // Add colors for the pie chart slices
  const colorMap = {
    TODO:        '#94a3b8',
    IN_PROGRESS: '#6366f1',
    IN_REVIEW:   '#f59e0b',
    DONE:        '#22c55e'
  };

  return result.map(r => ({
    status: r.status,
    count:  r.count,
    color:  colorMap[r.status] || '#94a3b8',
    label:  r.status.replace('_', ' ')
  }));
};

// ─── 4. TEAM PERFORMANCE ──────────────────────────────────────
// Powers the bar chart — who's completing most tasks
const getTeamPerformance = async (workspaceId, userId) => {

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  if (!member) throw new Error('Access denied');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // RANK() window function — ranks members by tasks completed
  // CASE WHEN = SQL if/else — counts only done tasks
  const result = await prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)::int    AS completed,
      COUNT(CASE WHEN t.status != 'DONE' THEN 1 END)::int   AS inProgress,
      COUNT(t.id)::int                                       AS total,
      RANK() OVER (
        ORDER BY COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) DESC
      )::int AS rank
    FROM "User" u
    JOIN "WorkspaceMember" wm ON u.id = wm."userId"
    LEFT JOIN "Task" t ON t."assigneeId" = u.id
      AND t."updatedAt" >= ${thirtyDaysAgo}
    WHERE wm."workspaceId" = ${workspaceId}
    GROUP BY u.id, u.name
    ORDER BY completed DESC
    LIMIT 10
  `;

  return result;
};

// ─── 5. PROJECT PROGRESS ──────────────────────────────────────
// Powers the progress bars — % complete per project
const getProjectProgress = async (workspaceId, userId) => {

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  if (!member) throw new Error('Access denied');

  const result = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.color,
      COUNT(t.id)::int                                          AS totalTasks,
      COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)::int       AS doneTasks,
      COUNT(CASE WHEN t."dueDate" < NOW() 
            AND t.status != 'DONE' THEN 1 END)::int            AS overdueTasks,
      CASE 
        WHEN COUNT(t.id) = 0 THEN 0
        ELSE ROUND(
          COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)::numeric 
          / COUNT(t.id) * 100
        )::int
      END AS progressPercent
    FROM "Project" p
    LEFT JOIN "Task" t ON t."projectId" = p.id AND t."parentId" IS NULL
    WHERE p."workspaceId" = ${workspaceId}
    GROUP BY p.id, p.name, p.color
    ORDER BY progressPercent DESC
  `;

  return result;
};

// ─── 6. PERSONAL STATS ────────────────────────────────────────
// Individual user's own performance — shown on profile/personal dashboard
const getPersonalStats = async (userId) => {

  const sevenDaysAgo  = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    completedThisWeek,
    completedThisMonth,
    assignedToMe,
    overdueAssigned
  ] = await Promise.all([

    prisma.task.count({
      where: {
        assigneeId: userId,
        status:     'DONE',
        updatedAt:  { gte: sevenDaysAgo }
      }
    }),

    prisma.task.count({
      where: {
        assigneeId: userId,
        status:     'DONE',
        updatedAt:  { gte: thirtyDaysAgo }
      }
    }),

    prisma.task.count({
      where: {
        assigneeId: userId,
        status:     { not: 'DONE' }
      }
    }),

    prisma.task.count({
      where: {
        assigneeId: userId,
        status:     { not: 'DONE' },
        dueDate:    { lt: new Date() }
      }
    })
  ]);

  return {
    completedThisWeek,
    completedThisMonth,
    assignedToMe,
    overdueAssigned
  };
};

module.exports = {
  getWorkspaceOverview,
  getTasksCompletedByDay,
  getTasksByStatus,
  getTeamPerformance,
  getProjectProgress,
  getPersonalStats
};