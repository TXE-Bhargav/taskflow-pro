const projectService = require('../services/project.service');

const createProject = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        if (!name) return res.status(400).json({ message: 'Project name is required' });
        const result = await projectService.createProject(req.user.id, req.params.workspaceId, { name, description, color });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProjects = async (req, res) => {
    try {
        const result = await projectService.getProjects(req.user.id, req.params.workspaceId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProjectById = async (req, res) => {
    try {
        const result = await projectService.getProjectById(req.user.id, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProject = async (req, res) => {
    try {
        const result = await projectService.updateProject(req.user.id, req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        await projectService.deleteProject(req.user.id, req.params.id);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const archiveProject = async (req, res) => {
    try {
        const result = await projectService.archiveProject(req.user.id, req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProjectMembers = async (req, res) => {
    try {
        const result = await projectService.getProjectMembers(req.user.id, req.params.id);
        res.json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};

const inviteToProject = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const result = await projectService.inviteToProject(req.user.id, req.params.id, email);
        res.status(201).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeMemberFromProject = async (req, res) => {
    try {
        const result = await projectService.removeMemberFromProject(
            req.user.id, req.params.id, req.params.userId
        );
        res.json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, archiveProject, getProjectMembers, inviteToProject,removeMemberFromProject };