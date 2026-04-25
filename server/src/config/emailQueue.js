// emailQueue.js — Background job queue for sending emails
// Instead of sending email directly in the API request,
// we ADD A JOB to this queue and it processes in background

const Bull = require('bull');
const { sendVerificationEmail, sendResetEmail, sendTaskAssignedEmail, sendCommentEmail } = require('./email');

const emailQueue = new Bull('email', {
    radis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
        attempts: 3,           // Retry up to 3 times if it fails
        backoff: {
            type: 'exponential',  // Wait longer between each retry
            delay: 5000          // Start with 5 second delay
        },
        removeOnComplete: true, // Remove job from queue when done
        removeOnFail: false     // Keep failed jobs for debugging
    }
});

// ─── PROCESS JOBS ────────────────────────────────────────────
// This function runs whenever a job is pulled from the queue
// It runs in background — completely separate from API requests

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

// ─── QUEUE EVENT LISTENERS ───────────────────────────────────
emailQueue.on('completed', (job) => {
    console.log(`✅ Email sent successfully: ${job.data.type}`);
});

emailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job failed: ${job.data.type}`, err.message);
});

emailQueue.on('stalled', (job) => {
    console.warn(`⚠️ Email job stalled: ${job.data.type}`);
});

// ─── HELPER FUNCTIONS ────────────────────────────────────────
// Controllers call these to add jobs to the queue
// They return instantly — no waiting for email to send

const queueVerificationEmail = (email, name, token) => {
    return emailQueue.add({ type: 'VERIFY_EMAIL', data: { email, name, token } });
};

const queueResetEmail = (email, name, token) => {
    return emailQueue.add({ type: 'RESET_PASSWORD', data: { email, name, token } });
};

const queueTaskAssignedEmail = (email, name, taskTitle, projectName, assignedBy) => {
    return emailQueue.add({
        type: 'TASK_ASSIGNED',
        data: { email, name, taskTitle, projectName, assignedBy }
    });
};

const queueCommentEmail = (email, name, taskTitle, commenterName, comment) => {
    return emailQueue.add({
        type: 'COMMENT_ADDED',
        data: { email, name, taskTitle, commenterName, comment }
    });
};

module.exports = {
    emailQueue,
    queueVerificationEmail,
    queueResetEmail,
    queueTaskAssignedEmail,
    queueCommentEmail
};