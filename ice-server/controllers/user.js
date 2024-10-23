const User = require('../models/User');

// Get current user
exports.getUser = async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get all users (for admin or user list)
exports.getUserList = async (req, res) => {
    try {
        const users = await User.find({});
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
