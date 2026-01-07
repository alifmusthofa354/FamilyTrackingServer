const userService = require('../services/userService');

exports.getProfile = async (req, res) => {
    try {
        // req.user.id comes from authMiddleware
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        // req.user.id comes from authMiddleware
        const updatedUser = await userService.updateUser(req.user.id, req.body);
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await userService.deleteUser(req.user.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const publicUrl = await userService.uploadProfilePicture(req.user.id, req.file);

        res.json({
            message: 'Photo uploaded successfully',
            imageUrl: publicUrl
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};
