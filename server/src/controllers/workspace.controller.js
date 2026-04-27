const workspaceService = require('../services/workspace.service');

const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Workspace name is required' });
        const result = await workspaceService.createWorkspace(req.user.id, { name, description });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserWorkspaces = async (req, res) => {
    try {
        const result = await workspaceService.getUserWorkspaces(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getWorkspaceById = async (req, res) => {
    try {
        const result = await workspaceService.getWorkspaceById(req.params.id, req.user.id);
        if (!result) return res.status(404).json({ message: 'Workspace not found' });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const inviteMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const result = await workspaceService.inviteMember(req.params.id, req.user.id, email, role);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createWorkspace, getUserWorkspaces, getWorkspaceById, inviteMember };