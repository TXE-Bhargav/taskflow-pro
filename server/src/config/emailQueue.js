const Bull = require('bull');
const { sendVerificationEmail, sendResetEmail, sendTaskAssignedEmail, sendCommentEmail } = require('./email');

// ─── REDIS CONFIG ────────────────────────────────────────────
const bullConfig = process.env.NODE_ENV === 'production'
    ? {
        redis: process.env.REDIS_URL,
        tls: { rejectUnauthorized: false }
    }
    : {
        redis: {
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT) || 6379,
        }
    };

const emailQueue = new Bull('email', bullConfig, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

// ─── PROCESS JOBS ────────────────────────────────────────────
emailQueue.process(async (job) => {
    const { type, data } = job.data;

    console.log(`📧 Processing email job: ${type}`);

    switch (type) {
        case 'VERIFY_EMAIL':
            await sendVerificationEmail(data.email, data.name, data.token);
            break;
        case 'RESET_PASSWORD':
            await sendResetEmail(data.email, data.name, data.token);
            break;
        case 'TASK_ASSIGNED':
            await sendTaskAssignedEmail(data.email, data.name, data.taskTitle, data.projectName, data.assignedBy);
            break;
        case 'COMMENT_ADDED':
            await sendCommentEmail(data.email, data.name, data.taskTitle, data.commenterName, data.comment);
            break;
        default:
            console.warn(`Unknown email job type: ${type}`);
    }
});

// ─── QUEUE EVENTS ────────────────────────────────────────────
emailQueue.on('completed', (job) => {
    console.log(`✅ Email sent: ${job.data.type}`);
});

emailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job failed: ${job.data.type}`, err.message);
});

emailQueue.on('stalled', (job) => {
    console.warn(`⚠️ Email job stalled: ${job.data.type}`);
});

emailQueue.on('error', (err) => {
    console.error('❌ Bull queue error:', err.message);
});

// ─── HELPERS ─────────────────────────────────────────────────
const queueVerificationEmail = (email, name, token) => {
    return emailQueue.add({ type: 'VERIFY_EMAIL', data: { email, name, token } });
};

const queueResetEmail = (email, name, token) => {
    return emailQueue.add({ type: 'RESET_PASSWORD', data: { email, name, token } });
};

const queueTaskAssignedEmail = (email, name, taskTitle, projectName, assignedBy) => {
    return emailQueue.add({ type: 'TASK_ASSIGNED', data: { email, name, taskTitle, projectName, assignedBy } });
};

const queueCommentEmail = (email, name, taskTitle, commenterName, comment) => {
    return emailQueue.add({ type: 'COMMENT_ADDED', data: { email, name, taskTitle, commenterName, comment } });
};

module.exports = {
    emailQueue,
    queueVerificationEmail,
    queueResetEmail,
    queueTaskAssignedEmail,
    queueCommentEmail
};