const workspaceService = require('../services/workspace.service');

const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Workspace name is required' });
        }
        const result = await workspaceService.createWorkspace(req.user.id, { name, description })
        res.status(201).json({
            message: 'Workspace created successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating workspace' });
    }
};

const getUserWorkspaces = async (req, res) => {
    try {
        const reslut = await workspaceService.getUserWorkspaces(req.user.id);
        res.status(200).json({
            message: 'Workspaces fetched successfully',
            data: reslut
        });
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
};

const getWorkspaceById = async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await workspaceService.getWorkspaceById(userId, req.user.id);
        if (!result) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        res.status(200).json({
            message: 'Workspace fetched successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching workspace' });
    }
}

const inviteMember = async (req, res) => {
    const { email , role } = req.body;
    try { 
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const result = await workspaceService.inviteMember(req.params.id, req.user.id, email, role);
        res.status(200).json({
            message: 'Member invited successfully',
            data: result
        });

    } catch (error) {
        res.status(500).json({ message: 'Error inviting member' });
    };
}
module.exports = { createWorkspace, getUserWorkspaces, getWorkspaceById, inviteMember };
