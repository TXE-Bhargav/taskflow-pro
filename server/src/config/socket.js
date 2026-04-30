const prisma = require('./prisma');
const { verifyAccessToken } = require('./jwt');

module.exports = (io) => {

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            console.log('Socket auth token received:', token ? 'present' : 'MISSING');

            if (!token) return next(new Error('Authentication error: No token provided'));

            const decode = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decode.userId },
                select: { id: true, name: true, email: true }
            });

            if (!user) return next(new Error('Authentication error: User not found'));

            socket.user = user; // ✅ Fixed typo
            next();
        } catch (error) {
            console.error('Socket auth failed:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`);

        socket.join(`user:${socket.user.id}`);
        console.log(`🔔 ${socket.user.name} joined personal room`);

        socket.on('join:workspace', async (workspaceId) => {
            try {
                const member = await prisma.workspaceMember.findUnique({
                    where: {
                        userId_workspaceId: {
                            userId: socket.user.id,
                            workspaceId  // ✅ Fixed typo
                        }
                    }
                });

                if (!member) {
                    return socket.emit('error', { message: 'Access denied: Not a workspace member' });
                }

                socket.join(`workspace:${workspaceId}`); // ✅ Fixed space
                console.log(`📥 ${socket.user.name} joined workspace:${workspaceId}`);

                socket.to(`workspace:${workspaceId}`).emit('user:online', {
                    userId: socket.user.id,
                    name: socket.user.name
                });

            } catch (error) {
                console.error('Error joining workspace:', error);
                socket.emit('error', { message: 'Failed to join workspace' });
            }
        });

        socket.on('leave:workspace', (workspaceId) => {
            socket.leave(`workspace:${workspaceId}`);
            socket.to(`workspace:${workspaceId}`).emit('user:offline', {
                userId: socket.user.id,
                name: socket.user.name
            });
        });

        socket.on('typing:start', ({ workspaceId, taskId }) => {
            socket.to(`workspace:${workspaceId}`).emit('typing:start', {
                userId: socket.user.id,
                name: socket.user.name,
                taskId
            });
        });

        socket.on('typing:stop', ({ workspaceId, taskId }) => {
            socket.to(`workspace:${workspaceId}`).emit('typing:stop', {
                userId: socket.user.id,
                taskId
            });
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.user.name}`);
        });
    });
};