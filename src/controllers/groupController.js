const groupService = require('../services/groupService');

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Group name is required' });

        const group = await groupService.createGroup(req.user.id, name);
        res.status(201).json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.join = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Group code is required' });

        const group = await groupService.joinGroup(req.user.id, code);
        res.json({ message: 'Joined successfully', group });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

exports.getMyGroup = async (req, res) => {
    try {
        const group = await groupService.getUserGroup(req.user.id);
        if (!group) return res.status(404).json({ message: 'No group found' });
        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
