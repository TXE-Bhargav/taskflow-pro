const workspaceService = require('../services/workspace.service');

const catchAsync = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const createWorkspace = catchAsync(async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await workspaceService.createWorkspace(req.user.id, { name, description });
    res.status(201).json(result);
});

const getUserWorkspaces = catchAsync(async (req, res) => {
    const result = await workspaceService.getUserWorkspaces(req.user.id);
    res.json(result);
});

const getWorkspaceById = catchAsync(async (req, res) => {
    const result = await workspaceService.getWorkspaceById(req.params.id, req.user.id);
    res.json(result);
});

const updateWorkspace = catchAsync(async (req, res) => {
    const result = await workspaceService.updateWorkspace(req.user.id, req.params.id, req.body);
    res.json(result);
});

const inviteMember = catchAsync(async (req, res) => {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const result = await workspaceService.inviteMember(
        req.io, req.params.id, req.user.id, email, role
    );
    res.status(201).json(result);
});

const acceptInvite = catchAsync(async (req, res) => {
    const result = await workspaceService.acceptInvite(req.user.id, req.params.id);
    res.json(result);
});

const declineInvite = catchAsync(async (req, res) => {
    const result = await workspaceService.declineInvite(req.user.id, req.params.id);
    res.json(result);
});

const removeMember = catchAsync(async (req, res) => {
    const result = await workspaceService.removeMember(
        req.params.id, req.user.id, req.params.userId
    );
    res.json(result);
});

const getPendingInvites = catchAsync(async (req, res) => {
    const result = await workspaceService.getPendingInvites(req.user.id);
    res.json(result);
});

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