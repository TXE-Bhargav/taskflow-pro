const prisma = require('../src/config/prisma');

async function migrate() {
  const projects = await prisma.project.findMany({
    include: {
      workspace: {
        include: { members: { where: { role: 'OWNER' } } }
      }
    }
  });

  for (const project of projects) {
    const owner = project.workspace.members[0];
    if (!owner) continue;

    const exists = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: owner.userId, projectId: project.id } }
    });

    if (!exists) {
      await prisma.projectMember.create({
        data: { userId: owner.userId, projectId: project.id, role: 'OWNER' }
      });
      console.log(`✅ Added owner to project: ${project.name}`);
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(console.error);