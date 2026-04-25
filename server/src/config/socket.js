const prisma = require('./prisma');
const { verifyAccessToken } = require('./jwt');

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error: No token provided"));

            const decode = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decode.userId },
                select: { id: true, name: true, email: true }
            });

            if (!user) return next(new Error("Authentication error: User not found"));

            soket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`);

        // Each user automatically joins their own private room
        // This lets us send notifications to a specific user
        socket.join(`user:${socket.user.id}`);
        console.log(`🔔 ${socket.user.name} joined personal room`);
        
        // ── JOIN WORKSPACE ROOM ──────────────────────────────────
        // Frontend emits this when user opens a workspace
        // This puts the socket in a room = they receive workspace events

        socket.on('join:workspace', async (workspaceId) => {
            try {
                const member = await prisma.workspaceMember.findUnique({
                    where: {
                        userId_workspaceId: {
                            userId: socket.user.id,
                            worspaceId
                        }
                    }
                });

                if (!member) return socket.emit('error', { message: 'Access denied: Not a workspace member' });

                socket.join(`workspace: ${workspaceId}`);
                console.log(`📥 ${socket.user.name} joined workspace ${workspaceId}`);

                socket.to(`workspace:${workspaceId}`).emit('user:online', {
                    userId: socket.user.id,
                    name: socket.user.name
                });

            } catch (error) {
                console.error('Error occurred while joining workspace:', error);
                socket.emit('error', { message: 'An error occurred while joining the workspace' });
            }
        });
        // ── LEAVE WORKSPACE ROOM ─────────────────────────────────
        socket.on('leave:workspace', (workspaceId) => {
            socket.leave(`workspace:${workspaceId}`);

            socket.to(`workspace:${workspaceId}`).emit('user:offline', {
                userId: socket.user.id,
                name: socket.user.name
            });
        });

        // ── TYPING INDICATOR IN COMMENTS ─────────────────────────
        // When user starts typing a comment, others see "John is typing..."
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

        // ── DISCONNECT ───────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.user.name}`);
        });

    });

}
