const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login logic
exports.login = async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        return res.json({ message: 'Logged in successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

// Save token logic
exports.saveToken = async (req, res) => {
    const { token } = req.body;
    try {
        // Here, you can save the token to the database or perform any action needed
        return res.json({ message: 'Token saved successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to save token' });
    }
};
